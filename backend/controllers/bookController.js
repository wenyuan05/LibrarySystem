const db = require('../db');
const net = require('net');
const { ProxyAgent } = require('undici');
const { notifyReservationsForAvailableBook } = require('../utils/notificationUtils');
const {
  ACTIVE_BORROW_STATUSES,
  ACTIVE_RESERVATION_STATUSES,
  OCCUPIED_COPY_STATUSES,
  placeholders
} = require('../utils/statusConstants');

const monthLookup = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12'
};

const normalizePublishDate = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue) || /^\d{4}$/.test(rawValue)) {
    return rawValue;
  }

  const monthYear = rawValue.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = monthLookup[monthYear[1].toLowerCase()];
    return month ? `${monthYear[2]}-${month}` : rawValue;
  }

  const monthDayYear = rawValue.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const month = monthLookup[monthDayYear[1].toLowerCase()];
    const day = monthDayYear[2].padStart(2, '0');
    return month ? `${monthDayYear[3]}-${month}-${day}` : rawValue;
  }

  return rawValue;
};

const ISBN_PATTERN = /^\d{10}(?:\d{3})?$/;
const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const ISBN_LOOKUP_PROVIDERS = [
  {
    id: 'openlibrary',
    name: 'OpenLibrary',
    endpoint: 'https://openlibrary.org/api/books',
    testIsbn: '9780743273565'
  },
  {
    id: 'googlebooks',
    name: 'Google Books',
    endpoint: 'https://www.googleapis.com/books/v1/volumes',
    testIsbn: '9780743273565'
  },
  {
    id: 'showapi',
    name: 'ShowAPI ISBN',
    endpoint: 'https://route.showapi.com/1626-1',
    testIsbn: '9787302124887',
    appKeyEnv: 'SHOWAPI_ISBN_APP_KEY'
  }
];

const getIsbnProvider = (providerId) => {
  return ISBN_LOOKUP_PROVIDERS.find(provider => provider.id === providerId) || ISBN_LOOKUP_PROVIDERS[0];
};

let proxyAgent = null;
let proxyCheckCache = { checkedAt: 0, available: false };

const getProxyConfig = () => ({
  mode: (process.env.BACKEND_PROXY_MODE || 'auto').toLowerCase(),
  host: process.env.BACKEND_PROXY_HOST || '127.0.0.1',
  port: parseInt(process.env.BACKEND_PROXY_PORT || '7890', 10)
});

const isProxyReachable = ({ host, port }, timeoutMs = 500) => new Promise((resolve) => {
  const socket = net.createConnection({ host, port });
  let settled = false;

  const finish = (available) => {
    if (settled) return;
    settled = true;
    socket.destroy();
    resolve(available);
  };

  socket.setTimeout(timeoutMs);
  socket.once('connect', () => finish(true));
  socket.once('timeout', () => finish(false));
  socket.once('error', () => finish(false));
});

const getFetchDispatcher = async () => {
  const proxyConfig = getProxyConfig();

  if (proxyConfig.mode === 'off' || proxyConfig.mode === 'false' || !Number.isInteger(proxyConfig.port)) {
    return undefined;
  }

  if (proxyConfig.mode !== 'on' && proxyConfig.mode !== 'true') {
    const now = Date.now();
    if (now - proxyCheckCache.checkedAt > 10000) {
      proxyCheckCache = {
        checkedAt: now,
        available: await isProxyReachable(proxyConfig)
      };
    }

    if (!proxyCheckCache.available) {
      return undefined;
    }
  }

  const proxyUri = `http://${proxyConfig.host}:${proxyConfig.port}`;
  if (!proxyAgent || proxyAgent.proxyUri !== proxyUri) {
    proxyAgent = new ProxyAgent(proxyUri);
    proxyAgent.proxyUri = proxyUri;
  }

  return proxyAgent;
};

const fetchJsonWithTimeout = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const dispatcher = await getFetchDispatcher();
    const response = await fetch(url, { signal: controller.signal, dispatcher });
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      throw new Error('Failed to parse API response');
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return { data, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
};

const postFormJsonWithTimeout = async (url, formData, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const dispatcher = await getFetchDispatcher();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
      signal: controller.signal,
      dispatcher
    });
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      throw new Error('Failed to parse API response');
    }

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return { data, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeOpenLibraryBook = (isbn, response) => {
  const bookKey = `ISBN:${isbn}`;
  const bookData = response?.[bookKey];

  if (!bookData) {
    return null;
  }

  const coverImage = bookData.cover?.large
    || bookData.cover?.medium
    || bookData.cover?.small
    || (bookData.cover?.id ? `https://covers.openlibrary.org/b/id/${bookData.cover.id}-L.jpg` : '');

  return {
    title: bookData.title || '',
    author: bookData.authors ? bookData.authors.map(author => author.name).join(', ') : '',
    publisher: bookData.publishers ? bookData.publishers.map(publisher => publisher.name).join(', ') : '',
    publish_date: normalizePublishDate(bookData.publish_date),
    isbn,
    description: bookData.description ? (typeof bookData.description === 'string' ? bookData.description : bookData.description.value) : '',
    cover_image: coverImage,
    language: 'English',
    page_count: bookData.number_of_pages || 0
  };
};

const normalizeGoogleBooksBook = (isbn, response) => {
  const bookData = response?.items?.[0]?.volumeInfo;

  if (!bookData) {
    return null;
  }

  return {
    title: bookData.title || '',
    author: bookData.authors ? bookData.authors.join(', ') : '',
    publisher: bookData.publisher || '',
    publish_date: normalizePublishDate(bookData.publishedDate),
    isbn,
    description: bookData.description || '',
    cover_image: bookData.imageLinks?.thumbnail || bookData.imageLinks?.smallThumbnail || '',
    language: bookData.language || 'English',
    page_count: bookData.pageCount || 0
  };
};

const normalizeShowApiBook = (isbn, response) => {
  const body = response?.showapi_res_body;
  const bookData = body?.data;

  if (response?.showapi_res_code !== 0 || body?.ret_code !== 0 || !bookData) {
    return null;
  }

  return {
    title: bookData.title || '',
    author: bookData.author || '',
    publisher: bookData.publisher || '',
    publish_date: normalizePublishDate(bookData.pubdate),
    isbn: bookData.isbn || isbn,
    description: bookData.gist || '',
    cover_image: bookData.img || '',
    language: 'Chinese',
    page_count: parseInt(bookData.page, 10) || 0
  };
};

const lookupBookByIsbn = async (isbn, providerId) => {
  const normalizedIsbn = String(isbn || '').trim().replace(/[-\s]/g, '');

  if (!ISBN_PATTERN.test(normalizedIsbn)) {
    const err = new Error('ISBN must be 10 or 13 digits');
    err.statusCode = 400;
    throw err;
  }

  const provider = getIsbnProvider(providerId);
  let url;
  let normalize;

  let result;

  if (provider.id === 'googlebooks') {
    url = `${provider.endpoint}?q=isbn:${encodeURIComponent(normalizedIsbn)}`;
    normalize = normalizeGoogleBooksBook;
    result = await fetchJsonWithTimeout(url);
  } else if (provider.id === 'showapi') {
    const appKey = process.env.SHOWAPI_ISBN_APP_KEY;
    if (!appKey) {
      const err = new Error('SHOWAPI_ISBN_APP_KEY is not configured');
      err.statusCode = 503;
      throw err;
    }
    url = `${provider.endpoint}?appKey=${encodeURIComponent(appKey)}`;
    normalize = normalizeShowApiBook;
    result = await postFormJsonWithTimeout(url, { isbn: normalizedIsbn });
  } else {
    url = `${provider.endpoint}?bibkeys=ISBN:${encodeURIComponent(normalizedIsbn)}&format=json&jscmd=data`;
    normalize = normalizeOpenLibraryBook;
    result = await fetchJsonWithTimeout(url);
  }

  const { data, status } = result;
  const book = normalize(normalizedIsbn, data);

  if (!book) {
    const err = new Error('Book not found');
    err.statusCode = 404;
    err.provider = provider;
    err.status = status;
    throw err;
  }

  return { book, provider, status };
};

// 获取所有书籍（无需登录，公开访问）
exports.getAllBooks = (req, res) => {
  db.all('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
};

// 获取单本书籍（无需登录，公开访问）
exports.getBookById = (req, res) => {
  const { id } = req.params;
  db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(row);
  });
};

// 添加书籍（管理员）
exports.addBook = (req, res) => {
  const { title, author, isbn, description, cover_image, total_copies, publisher, publish_date, language, page_count, location } = req.body;
  
  // 检查ISBN是否已存在
  db.get('SELECT id FROM books WHERE isbn = ?', [isbn], (err, existingBook) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (existingBook) {
      res.status(400).json({ error: 'Book with this ISBN already exists' });
      return;
    }
    
    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // 插入新书籍
        const copies = total_copies || 1;
        db.run(
          'INSERT INTO books (title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, author, isbn, description, cover_image, copies, copies, publisher, publish_date, language || 'English', page_count],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            const bookId = this.lastID;
            const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
            let copyCount = 0;
            const totalCopies = copies;

            // 创建副本记录
        for (let i = 0; i < totalCopies; i++) {
          const copyCode = `CP-${bookId}-${String(i + 1).padStart(3, '0')}`;
          insertCopy.run(bookId, copyCode, 'available', location, (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                copyCount++;
                if (copyCount === totalCopies) {
                  insertCopy.finalize(() => {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                      }
                      res.json({ 
                        id: bookId, 
                        title, 
                        author, 
                        isbn, 
                        description,
                        cover_image,
                        total_copies: copies,
                        available_copies: copies,
                        publisher,
                        publish_date,
                        language: language || 'English',
                        page_count
                      });
                    });
                  });
                }
              });
            }
          }
        );
      });
    });
  });
};

// 更新书籍信息（管理员）
exports.updateBook = (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, description, cover_image, total_copies, publisher, publish_date, language, page_count } = req.body;
  
  // 构建更新语句
  const updateFields = [];
  const updateValues = [];
  
  if (title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(title);
  }
  if (author !== undefined) {
    updateFields.push('author = ?');
    updateValues.push(author);
  }
  if (isbn !== undefined) {
    updateFields.push('isbn = ?');
    updateValues.push(isbn);
  }

  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }
  if (cover_image !== undefined) {
    updateFields.push('cover_image = ?');
    updateValues.push(cover_image);
  }
  if (total_copies !== undefined) {
    const parsedTotalCopies = Number(total_copies);
    if (!Number.isInteger(parsedTotalCopies) || parsedTotalCopies < 1) {
      res.status(400).json({ error: 'Total copies must be a positive integer' });
      return;
    }
    updateFields.push('total_copies = ?');
    updateValues.push(parsedTotalCopies);
  }
  if (publisher !== undefined) {
    updateFields.push('publisher = ?');
    updateValues.push(publisher);
  }
  if (publish_date !== undefined) {
    updateFields.push('publish_date = ?');
    updateValues.push(publish_date);
  }
  if (language !== undefined) {
    updateFields.push('language = ?');
    updateValues.push(language);
  }
  if (page_count !== undefined) {
    updateFields.push('page_count = ?');
    updateValues.push(page_count);
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 执行更新
      const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
      db.run(sql, [...updateValues, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }
        
        // 如果更新了副本数量，处理副本记录
        if (total_copies !== undefined) {
          // 获取当前副本数量
          db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [id], (err, result) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            
            const currentCount = result.count || 0;
            const targetCount = parseInt(total_copies, 10);
            
            if (currentCount < targetCount) {
              // 需要添加副本
              db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [id], (err, countResult) => {
                if (err) { db.run('ROLLBACK'); res.status(500).json({ error: err.message }); return; }

                const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
                let addedCount = 0;
                const addCount = targetCount - currentCount;

                for (let i = 0; i < addCount; i++) {
                  const seq = countResult.count + i + 1;
                  const copyCode = `CP-${id}-${String(seq).padStart(3, '0')}`;
                  insertCopy.run(id, copyCode, 'available', null, (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  
                  addedCount++;
                  if (addedCount === addCount) {
                    insertCopy.finalize(() => {
                      // 重新计算可用副本数
                      db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [id, 'available'], (err, result) => {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }
                        
                        // 更新可用副本数
                        db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, id], (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          // 返回更新后的书籍信息
                          db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
                            if (err) {
                              db.run('ROLLBACK');
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            db.run('COMMIT', (err) => {
                              if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                              }
                              res.json(book);
                            });
                          });
                        });
                      });
                    });
                  }
                });
              }
            });
          } else if (currentCount > targetCount) {
              // 需要删除副本（只删除可用状态的副本）
              db.all('SELECT id FROM book_copies WHERE book_id = ? AND status = ? LIMIT ?', [id, 'available', currentCount - targetCount], (err, copies) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                if (copies.length < currentCount - targetCount) {
                  // 没有可用副本可以删除
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Cannot reduce copies: not enough available copies to remove' });
                  return;
                }
                
                const deleteCopy = db.prepare('DELETE FROM book_copies WHERE id = ?');
                let deletedCount = 0;
                const deleteCount = copies.length;
                
                copies.forEach(copy => {
                  deleteCopy.run(copy.id, (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    
                    deletedCount++;
                    if (deletedCount === deleteCount) {
                      deleteCopy.finalize(() => {
                        // 重新计算可用副本数
                        db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [id, 'available'], (err, result) => {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          
                          // 更新可用副本数
                          db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, id], (err) => {
                            if (err) {
                              db.run('ROLLBACK');
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            
                            // 返回更新后的书籍信息
                            db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
                              if (err) {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                                return;
                              }
                              db.run('COMMIT', (err) => {
                                if (err) {
                                  res.status(500).json({ error: err.message });
                                  return;
                                }
                                res.json(book);
                              });
                            });
                          });
                        });
                      });
                    }
                  });
                });
              });
            } else {
              // 副本数量不变，直接返回
              db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                db.run('COMMIT', (err) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res.json(book);
                });
              });
            }
          });
        } else {
          // 没有更新副本数量，直接返回
          db.get('SELECT id, title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count, created_at, updated_at FROM books WHERE id = ?', [id], (err, book) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }
            db.run('COMMIT', (err) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              res.json(book);
            });
          });
        }
      });
    });
  });
};

// 删除书籍（管理员）
exports.deleteBook = (req, res) => {
  const { id } = req.params;
  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    res.status(400).json({ error: 'Invalid book id' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get('SELECT id FROM books WHERE id = ?', [bookId], (err, book) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!book) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }

        db.get(
          `SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status IN (${placeholders(ACTIVE_BORROW_STATUSES)})`,
          [bookId, ...ACTIVE_BORROW_STATUSES],
          (err, borrowResult) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            if (borrowResult.count > 0) {
              db.run('ROLLBACK');
              res.status(400).json({ error: 'Cannot delete book: it has active borrowing records' });
              return;
            }

            db.get(
              `SELECT COUNT(*) as count FROM book_copies WHERE book_id = ? AND status IN (${placeholders(OCCUPIED_COPY_STATUSES)})`,
              [bookId, ...OCCUPIED_COPY_STATUSES],
              (err, copyResult) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }

                if (copyResult.count > 0) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Cannot delete book: it has occupied copies' });
                  return;
                }

                db.get(
                  `SELECT COUNT(*) as count FROM reservation_records WHERE book_id = ? AND status IN (${placeholders(ACTIVE_RESERVATION_STATUSES)})`,
                  [bookId, ...ACTIVE_RESERVATION_STATUSES],
                  (err, reservationResult) => {
                    if (err) {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: err.message });
                      return;
                    }

                    if (reservationResult.count > 0) {
                      db.run('ROLLBACK');
                      res.status(400).json({ error: 'Cannot delete book: it has active reservations' });
                      return;
                    }

                    db.run('DELETE FROM book_categories WHERE book_id = ?', [bookId], (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                      }

                      db.run('DELETE FROM book_copies WHERE book_id = ?', [bookId], (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }

                        db.run('DELETE FROM books WHERE id = ?', [bookId], (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                          }

                          db.run('COMMIT', (err) => {
                            if (err) {
                              res.status(500).json({ error: err.message });
                              return;
                            }
                            res.json({ message: 'Book deleted' });
                          });
                        });
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};

exports.searchBooks = (req, res) => {
  const { query, category } = req.query;
  
  if (!query && !category) {
    res.status(400).json({ error: 'Search query or category is required' });
    return;
  }

  let sql = 'SELECT b.id, b.title, b.author, b.isbn, b.description, b.cover_image, b.total_copies, b.available_copies, b.publisher, b.publish_date, b.language, b.page_count, b.created_at, b.updated_at FROM books b';
  const params = [];

  // 如果指定了分类，添加分类关联
  if (category) {
    sql += ' JOIN book_categories bc ON b.id = bc.book_id';
  }

  // 添加 WHERE 子句
  sql += ' WHERE';
  
  if (query) {
    sql += ' (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)';
    params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (category) {
    if (query) sql += ' AND';
    sql += ' bc.category_id = ?';
    params.push(parseInt(category));
  }

  // 执行查询
  db.all(sql, params, (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // 返回空数组而不是404错误
    res.json(books || []);
  });
};

// 获取热门图书（无需登录，公开访问）
exports.getPopularBooks = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // 通过统计借阅次数来获取热门图书
  const sql = `
    SELECT b.id, b.title, b.author, b.isbn, b.description, b.cover_image, b.total_copies, b.available_copies, b.publisher, b.publish_date, b.language, b.page_count, b.created_at, b.updated_at, COUNT(br.id) as borrow_count 
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `;
  
  db.all(sql, [limit], (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(books);
  });
};

// 导出图书和副本组合信息到CSV（管理员/图书管理员）
exports.exportBooks = (req, res) => {
  const sql = `
    SELECT b.id, b.title, b.author, b.isbn,
           b.description, b.total_copies, b.available_copies,
           b.publisher, b.publish_date, b.language, b.page_count,
           b.created_at as book_created_at, b.updated_at as book_updated_at,
           GROUP_CONCAT(DISTINCT c.name) as categories,
           bc_copy.id as copy_id, bc_copy.copy_code, bc_copy.status as copy_status,
           bc_copy.location as copy_location, bc_copy.created_at as copy_created_at,
           bc_copy.updated_at as copy_updated_at
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    LEFT JOIN book_copies bc_copy ON b.id = bc_copy.book_id
    GROUP BY b.id, bc_copy.id
    ORDER BY b.id ASC, bc_copy.id ASC
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const headers = [
      'Book ID',
      'Title',
      'Author',
      'ISBN',
      'Book Status',
      'Description',
      'Total Copies',
      'Available Copies',
      'Publisher',
      'Publish Date',
      'Language',
      'Page Count',
      'Categories',
      'Book Created At',
      'Book Updated At',
      'Copy ID',
      'Copy Code',
      'Copy Status',
      'Copy Location',
      'Copy Created At',
      'Copy Updated At'
    ];
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => [
        row.id,
        row.title,
        row.author,
        row.isbn,
        row.available_copies > 0 ? 'Available' : 'Not Available',
        row.description,
        row.total_copies,
        row.available_copies,
        row.publisher,
        row.publish_date,
        row.language,
        row.page_count,
        row.categories,
        row.book_created_at,
        row.book_updated_at,
        row.copy_id,
        row.copy_code,
        row.copy_status,
        row.copy_location,
        row.copy_created_at,
        row.copy_updated_at
      ].map(escapeCsvValue).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=books_with_copies_${new Date().toISOString().split('T')[0]}.csv`);

    res.send(`\uFEFF${csvContent}`);
  });
};

// 获取书籍的所有副本（公开访问）
exports.getBookCopies = (req, res) => {
  const { book_id } = req.params;
  
  db.all('SELECT * FROM book_copies WHERE book_id = ? ORDER BY id', [book_id], (err, copies) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(copies);
  });
};

// 添加单个书籍副本（管理员/图书管理员）
exports.addBookCopy = (req, res) => {
  const { book_id } = req.params;
  const location = (req.body.location || 'Main Shelf').trim() || 'Main Shelf';

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get('SELECT id FROM books WHERE id = ?', [book_id], (err, book) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!book) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Book not found' });
          return;
        }

        db.all('SELECT copy_code FROM book_copies WHERE book_id = ?', [book_id], (err, copies) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          const maxSeq = copies.reduce((max, copy) => {
            const match = (copy.copy_code || '').match(/-(\d+)$/);
            const seq = match ? parseInt(match[1], 10) : 0;
            return Math.max(max, seq);
          }, 0);
          const copyCode = `CP-${book_id}-${String(maxSeq + 1).padStart(3, '0')}`;

          db.run(
            'INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)',
            [book_id, copyCode, 'available', location],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }

              const copyId = this.lastID;
              db.get('SELECT COUNT(*) as total_count FROM book_copies WHERE book_id = ?', [book_id], (err, totalResult) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }

                db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [book_id, 'available'], (err, availableResult) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  db.run(
                    'UPDATE books SET total_copies = ?, available_copies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [totalResult.total_count, availableResult.available_count, book_id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                        return;
                      }

                      notifyReservationsForAvailableBook(book_id, (notifyErr, notifiedCount) => {
                        if (notifyErr) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: notifyErr.message });
                          return;
                        }

                        db.run('COMMIT', (err) => {
                          if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          res.status(201).json({
                            id: copyId,
                            book_id: Number(book_id),
                            copy_code: copyCode,
                            status: 'available',
                            location,
                            notifications_sent: notifiedCount || 0
                          });
                        });
                      });
                    }
                  );
                });
              });
            }
          );
        });
      });
    });
  });
};

// 获取单个副本信息（公开访问）
exports.deleteBookCopy = (req, res) => {
  const { id } = req.params;
  const copyId = Number(id);

  if (!Number.isInteger(copyId) || copyId <= 0) {
    res.status(400).json({ error: 'Invalid copy id' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get('SELECT id, book_id, status FROM book_copies WHERE id = ?', [copyId], (err, copy) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (!copy) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Copy not found' });
          return;
        }
        if (copy.status !== 'available') {
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Cannot delete copy: only available copies can be deleted' });
          return;
        }

        db.get('SELECT COUNT(*) as count FROM book_copies WHERE book_id = ?', [copy.book_id], (err, totalResult) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          if (totalResult.count <= 1) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'Cannot delete copy: a book must keep at least one copy' });
            return;
          }

          db.get(
            `SELECT COUNT(*) as count FROM borrow_records WHERE copy_id = ? AND status IN (${placeholders(ACTIVE_BORROW_STATUSES)})`,
            [copyId, ...ACTIVE_BORROW_STATUSES],
            (err, borrowResult) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              if (borrowResult.count > 0) {
                db.run('ROLLBACK');
                res.status(400).json({ error: 'Cannot delete copy: it has active borrowing records' });
                return;
              }

              db.run('DELETE FROM book_copies WHERE id = ? AND status = ?', [copyId, 'available'], function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                if (this.changes === 0) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Cannot delete copy: copy is no longer available' });
                  return;
                }

                db.get('SELECT COUNT(*) as total_count FROM book_copies WHERE book_id = ?', [copy.book_id], (err, totalAfterDelete) => {
                  if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                  }

                  db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [copy.book_id, 'available'], (err, availableAfterDelete) => {
                    if (err) {
                      db.run('ROLLBACK');
                      res.status(500).json({ error: err.message });
                      return;
                    }

                    db.run(
                      'UPDATE books SET total_copies = ?, available_copies = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                      [totalAfterDelete.total_count, availableAfterDelete.available_count, copy.book_id],
                      (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          res.status(500).json({ error: err.message });
                          return;
                        }

                        db.run('COMMIT', (err) => {
                          if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          res.json({ message: 'Copy deleted successfully' });
                        });
                      }
                    );
                  });
                });
              });
            }
          );
        });
      });
    });
  });
};

exports.getCopyById = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM book_copies WHERE id = ?', [id], (err, copy) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!copy) {
      res.status(404).json({ error: 'Copy not found' });
      return;
    }
    res.json(copy);
  });
};

// 更新副本状态（管理员/图书管理员）
exports.updateCopyStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log('Update copy status request received:', { id, status });
  
  // 验证状态值
  const validStatuses = ['available', 'unavailable', 'borrowing', 'borrowed', 'reserved'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status. Valid statuses are: available, unavailable, borrowing, borrowed, reserved' });
    return;
  }
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新副本状态
      db.run('UPDATE book_copies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Copy not found' });
          return;
        }

        // 获取副本信息以获取book_id
        db.get('SELECT book_id FROM book_copies WHERE id = ?', [id], (err, copy) => {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }

          // 重新计算可用副本数
          db.get('SELECT COUNT(*) as available_count FROM book_copies WHERE book_id = ? AND status = ?', [copy.book_id, 'available'], (err, result) => {
            if (err) {
              db.run('ROLLBACK');
              res.status(500).json({ error: err.message });
              return;
            }

            // 更新书籍表中的可用副本数
            db.run('UPDATE books SET available_copies = ? WHERE id = ?', [result.available_count, copy.book_id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }

              const commitStatusUpdate = (notificationsSent = 0) => {
                db.run('COMMIT', (err) => {
                  if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                  }
                  res.json({
                    message: 'Copy status updated successfully',
                    notifications_sent: notificationsSent
                  });
                });
              };

              if (status !== 'available') {
                commitStatusUpdate();
                return;
              }

              notifyReservationsForAvailableBook(copy.book_id, (notifyErr, notifiedCount) => {
                if (notifyErr) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: notifyErr.message });
                  return;
                }
                commitStatusUpdate(notifiedCount || 0);
              });
            });
          });
        });
      });
    });
  });
};

// 更新副本位置（管理员/图书管理员）
exports.updateCopyLocation = (req, res) => {
  const { id } = req.params;
  const { location } = req.body;
  
  // 开始事务
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新副本位置
      db.run('UPDATE book_copies SET location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [location, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: 'Copy not found' });
          return;
        }

        // 提交事务
        db.run('COMMIT', (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ message: 'Copy location updated successfully' });
        });
      });
    });
  });
};

exports.getIsbnProviders = (req, res) => {
  res.json(ISBN_LOOKUP_PROVIDERS.map(provider => ({
    id: provider.id,
    name: provider.name,
    endpoint: provider.endpoint,
    test_isbn: provider.testIsbn,
    requires_app_key: Boolean(provider.appKeyEnv),
    configured: provider.appKeyEnv ? Boolean(process.env[provider.appKeyEnv]) : true
  })));
};

exports.testIsbnProvider = async (req, res) => {
  const providerId = req.body?.provider || req.query?.provider;
  const provider = getIsbnProvider(providerId);
  const testIsbn = String(req.body?.isbn || req.query?.isbn || provider.testIsbn).trim().replace(/[-\s]/g, '');
  const startedAt = Date.now();

  try {
    const result = await lookupBookByIsbn(testIsbn, provider.id);
    res.json({
      provider: provider.id,
      provider_name: provider.name,
      endpoint: provider.endpoint,
      available: true,
      status: result.status,
      latency_ms: Date.now() - startedAt,
      last_tested_at: new Date().toISOString(),
      test_isbn: testIsbn
    });
  } catch (err) {
    res.status(200).json({
      provider: provider.id,
      provider_name: provider.name,
      endpoint: provider.endpoint,
      available: false,
      status: err.status || err.statusCode || null,
      latency_ms: Date.now() - startedAt,
      last_tested_at: new Date().toISOString(),
      test_isbn: testIsbn,
      error: err.message || 'Provider test failed'
    });
  }
};

// 通过 ISBN 查询书籍信息
exports.searchByISBN = async (req, res) => {
  const { isbn } = req.params;
  const providerId = req.query.provider;

  try {
    const result = await lookupBookByIsbn(isbn, providerId);
    res.json({
      ...result.book,
      provider: result.provider.id,
      provider_name: result.provider.name
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch book information' });
  }
};

// 批量导入书籍
exports.batchImportBooks = (req, res) => {
  const { books } = req.body;
  
  if (!books || !Array.isArray(books)) {
    res.status(400).json({ error: 'Invalid request data' });
    return;
  }

  const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

  const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

  const finalizeAsync = (statement) => new Promise((resolve, reject) => {
    statement.finalize((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  const runStatementAsync = (statement, params = []) => new Promise((resolve, reject) => {
    statement.run(params, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  const importBook = async (bookData, results) => {
    const { title, author, publisher, publish_date, isbn, description, cover_image, total_copies = 1, location = 'Main Shelf', category_id, language, page_count } = bookData;

    try {
      const normalizedIsbn = String(isbn || '').trim().replace(/[-\s]/g, '');
      if (!ISBN_PATTERN.test(normalizedIsbn)) {
        results.failed++;
        results.errors.push({ isbn: isbn || 'unknown', error: 'ISBN must be 10 or 13 digits' });
        return;
      }

      if (!title || !String(title).trim()) {
        results.failed++;
        results.errors.push({ isbn: normalizedIsbn, error: 'Title is required' });
        return;
      }

      if (!author || !String(author).trim()) {
        results.failed++;
        results.errors.push({ isbn: normalizedIsbn, error: 'Author is required' });
        return;
      }

      const existingBook = await getAsync('SELECT id FROM books WHERE isbn = ?', [normalizedIsbn]);
      if (existingBook) {
        results.failed++;
        results.errors.push({ isbn: normalizedIsbn, error: 'Book with this ISBN already exists' });
        return;
      }

      const parsedCopies = parseInt(total_copies, 10);
      const copies = Number.isFinite(parsedCopies) && parsedCopies > 0 ? Math.min(parsedCopies, 100) : 1;
      const normalizedLanguage = (language || 'English').trim() || 'English';
      const parsedPageCount = parseInt(page_count, 10);
      const normalizedPageCount = Number.isFinite(parsedPageCount) && parsedPageCount > 0 ? parsedPageCount : 0;
      const insertResult = await runAsync(
        'INSERT INTO books (title, author, isbn, description, cover_image, total_copies, available_copies, publisher, publish_date, language, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [String(title).trim(), String(author).trim(), normalizedIsbn, description, cover_image, copies, copies, publisher, publish_date, normalizedLanguage, normalizedPageCount]
      );
      const bookId = insertResult.lastID;

      if (category_id) {
        try {
          await runAsync(
            'INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES (?, ?)',
            [bookId, category_id]
          );
        } catch (err) {
          console.error('批量导入分类关联失败:', err.message);
        }
      }

      const insertCopy = db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)');
      const totalCopies = copies;
      const copyLocation = (location || 'Main Shelf').trim() || 'Main Shelf';

      try {
        for (let i = 0; i < totalCopies; i++) {
          const copyCode = `CP-${bookId}-${String(i + 1).padStart(3, '0')}`;
          await runStatementAsync(insertCopy, [bookId, copyCode, 'available', copyLocation]);
        }
      } finally {
        await finalizeAsync(insertCopy);
      }

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ isbn: isbn || 'unknown', error: err.message });
    }
  };

  db.serialize(() => {
    (async () => {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      try {
        await runAsync('BEGIN TRANSACTION');

        for (const bookData of books) {
          await importBook(bookData, results);
        }

        await runAsync('COMMIT');
        res.json(results);
      } catch (err) {
        db.run('ROLLBACK', () => {
          res.status(500).json({ error: err.message });
        });
      }
    })();
  });
};
