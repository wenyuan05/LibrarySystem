import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

const Barcode = ({ code, width = 2, height = 50, showText = true }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (code && svgRef.current) {
      try {
        JsBarcode(svgRef.current, code, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: showText,
          fontSize: 12,
          margin: 4,
          background: '#ffffff'
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [code, width, height, showText]);

  if (!code) return null;

  return (
    <div className="barcode-container" style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '4px 8px',
      background: '#fff',
      borderRadius: '4px'
    }}>
      <svg ref={svgRef} />
    </div>
  );
};

export default Barcode;
