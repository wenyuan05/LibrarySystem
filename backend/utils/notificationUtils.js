const db = require('../db');
const { sendMailSafe } = require('../services/emailService');

exports.notifyReservationsForAvailableBook = function(bookId, next) {
  db.all(
    `SELECT rr.id, rr.user_id, b.title, u.email, u.name
     FROM reservation_records rr
     JOIN books b ON rr.book_id = b.id
     JOIN users u ON rr.user_id = u.id
     WHERE rr.book_id = ?
       AND rr.status = 'active'
       AND rr.notification_sent = 0
       AND b.available_copies > 0
     ORDER BY rr.reservation_date ASC, rr.id ASC`,
    [bookId],
    function(err, reservations) {
      if (err) {
        next(err);
        return;
      }
      if (!reservations || reservations.length === 0) {
        next(null, 0);
        return;
      }

      let completed = 0;
      let notified = 0;
      let failed = false;

      reservations.forEach(function(reservation) {
        const title = 'Reserved book available';
        const message = `"${reservation.title}" is now available. Please borrow it when convenient.`;

        db.run(
          'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
          [reservation.user_id, title, message, 'reservation', reservation.id],
          function(insertErr) {
            if (failed) return;
            if (insertErr) {
              failed = true;
              next(insertErr);
              return;
            }
            sendMailSafe({
              userId: reservation.user_id,
              to: reservation.email,
              scenario: 'notification',
              subject: title,
              text: `Hello ${reservation.name}, ${message}`,
              html: `<p>Hello ${reservation.name},</p><p>${message}</p>`
            });

            db.run(
              'UPDATE reservation_records SET notification_sent = 1 WHERE id = ?',
              [reservation.id],
              function(updateErr) {
                if (failed) return;
                if (updateErr) {
                  failed = true;
                  next(updateErr);
                  return;
                }

                notified++;
                completed++;
                if (completed === reservations.length) {
                  next(null, notified);
                }
              }
            );
          }
        );
      });
    }
  );
};
