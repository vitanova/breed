import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Function to parse fraction strings like "3/32" to a numerical value
const parseFraction = (fraction) => {
  const [numerator, denominator] = fraction.split('/').map(Number);
  return numerator / denominator;
};
function App() {
  const [parentGenes, setParentGenes] = useState(['m, Aa, Bb, Cc', 'f, Aa, Bb, Cc']);  // Default two parent genes
  const [targetGenes, setTargetGenes] = useState([]);  // Empty target gene initially
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});  // Keeps track of which result is expanded

  const handleParentGeneChange = (index, value) => {
    const newGenes = [...parentGenes];
    newGenes[index] = value;
    setParentGenes(newGenes);
  };

  const handleTargetGeneChange = (index, value) => {
    const newGenes = [...targetGenes];
    newGenes[index] = value;
    setTargetGenes(newGenes);
  };

  const handleAddParentGene = () => {
    setParentGenes([...parentGenes, '']);  // Add an empty parent gene input
  };

  const handleAddTargetGene = () => {
    setTargetGenes([...targetGenes, 'f, Aa, Bb, Cc']);  // Add target gene with default value
  };

  const handleRemoveParentGene = (index) => {
    const newGenes = parentGenes.filter((_, i) => i !== index);
    setParentGenes(newGenes);
  };

  const handleRemoveTargetGene = (index) => {
    const newGenes = targetGenes.filter((_, i) => i !== index);
    setTargetGenes(newGenes);
  };

  const toggleExpand = (index) => {
    setExpanded((prevState) => ({
      ...prevState,
      [index]: !prevState[index]  // Toggle expansion state
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure parentGenes has at least 2 entries, and fill in default placeholders if needed
    const filledParentGenes = parentGenes.map(gene => gene.trim() !== '' ? gene : 'f, Aa, Bb, Cc');

    // Convert each list input (comma-separated string) into an array
    const parsedParentGenes = filledParentGenes.map(gene => gene.split(',').map(item => item.trim()));
    const parsedTargetGenes = targetGenes.map(gene => gene.split(',').map(item => item.trim()));

    // Clear previous error and result
    setError('');
    setResult(null);

    try {
      // Send the data to the Flask backend
      const response = await axios.post('generate_children', {
        parents: parsedParentGenes,
        targets: parsedTargetGenes
      });

      // Sort results by 'sum' in descending order
      const sortedResults = response.data.results
        .filter(res => res && Object.keys(res).length > 0)  // Filter out empty results
        .sort((a, b) => parseFraction(b.sum) - parseFraction(a.sum));

      // Update result state with the backend response
      setResult(sortedResults);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while connecting to the server.');
    }
  };

  return (
    <div className="App">
      <h1>Gene Pairing and Target Matching</h1>
      <form onSubmit={handleSubmit}>
        {/* Parent Genes Input */}
        <h3>Parents' Genes</h3>
        {parentGenes.map((gene, index) => (
          <div key={index} className="list-input">
            <label>Parent Gene {index + 1} (comma separated):</label>
            <input
              type="text"
              value={gene}
              onChange={(e) => handleParentGeneChange(index, e.target.value)}
              placeholder={index === 0 ? 'm, Aa, Bb, Cc' : 'f, Aa, Bb, Cc'}
              required
            />
            {parentGenes.length > 2 && (
              <button type="button" onClick={() => handleRemoveParentGene(index)}>
                Remove Parent
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddParentGene}>
          Add Another Parent Gene
        </button>

        {/* Target Genes Input */}
        <h3>Target Genes for Children</h3>
        {targetGenes.map((gene, index) => (
          <div key={index} className="list-input">
            <label>Target Gene {index + 1} (comma separated):</label>
            <input
              type="text"
              value={gene}
              onChange={(e) => handleTargetGeneChange(index, e.target.value)}
              placeholder="f, Aa, Bb, Cc"
            />
            <button type="button" onClick={() => handleRemoveTargetGene(index)}>
              Remove Target
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddTargetGene}>
          Add Another Target Gene
        </button>

        <button type="submit">Submit</button>
      </form>

      {error && <p className="error">{error}</p>}

      {/* Display the result */}
      {result && result.length > 0 && (
        <div className="result">
          <h3>Generated Children Results</h3>
          {result.map((res, index) => {
            // Skip any empty objects
            if (!res || !res.childs || Object.keys(res).length === 0) {
              return null;
            }

            return (
              <div key={index} className="result-summary">
                {/* Summary row */}
                <div className="summary-row" onClick={() => toggleExpand(index)}>
                  <h4>
                    Parents: Father ({res.father ? res.father.join(', ') : 'Unknown'}) and Mother ({res.mother ? res.mother.join(', ') : 'Unknown'})
                  </h4>
                  <p>Sum Probability: {res.sum}</p>
                  <button type="button">{expanded[index] ? 'Hide Details' : 'Show Details'}</button>
                </div>

                {/* Expanded details (folded by default) */}
                {expanded[index] && (
                  <div className="result-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Child Gene</th>
                          <th>Probability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {res.childs.map((child, childIndex) => (
                          <tr key={childIndex}>
                            <td>{child.gene.join(', ')}</td>
                            <td>{child.prob}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;