import React from "react";

// CSS styles to mimic Java program output
const styles = {
  container: {
    width: '60%', // Adjust width as needed
    maxHeight: '30%', // Adjust height as needed
    overflowY: 'scroll', // Add vertical scroll
    backgroundColor: '#f0f0f0', // Light grey background similar to console
    border: '1px solid #ccc', // Border to mimic console edges
    fontFamily: 'monospace', // Monospaced font similar to console output
    fontSize: '16px', // Adjust size as needed
    color: 'black', // Text color
    padding: '10px', // Padding inside the container
    whiteSpace: 'pre-line', // Keep line breaks
    flexDirection: "column-reverse"
  }
};

// React component
const ScrollableTextComponent = ({ text }) => {
  return (
    <div style={styles.container}>
      {text}
    </div>
  );
};

export default ScrollableTextComponent;