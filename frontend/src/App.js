import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Function to parse fraction strings like "3/32" to a numerical value
const parseFraction = (fraction) => {
  const [numerator, denominator] = fraction.split('/').map(Number);
  return numerator / denominator;
};

// Reusable SliderToggle component
const SliderToggle = ({ options, selectedOption, onChange }) => {
  return (
    <div className="slider-toggle">
      {options.map((option, index) => (
        <span
          key={index}
          className={`slider-option ${selectedOption === option ? 'selected' : 'unselected'}`}
          onClick={() => onChange(option)}
        >
          {option}
        </span>
      ))}
    </div>
  );
};

function App() {
  const genderOptions = ['m', 'f'];  // Predefined gender options
  const geneAOptions = ['AA', 'Aa', 'aa'];  // Predefined gene A options
  const geneBOptions = ['BB', 'Bb', 'bb'];  // Predefined gene B options
  const geneCOptions = ['CC', 'Cc', 'cc'];  // Predefined gene C options

  // Initial states for parent and target genes
  const [parentGenes, setParentGenes] = useState([
    { gender: 'm', genes: ['Aa', 'Bb', 'Cc'] },
    { gender: 'f', genes: ['AA', 'BB', 'CC'] }
  ]);
  const [targetGenes, setTargetGenes] = useState([
    { gender: 'm', genes: ['AA', 'BB', 'CC'] }
  ]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});  // Keeps track of which result is expanded

  // Function to handle toggle changes
  const handleToggle = (genes, setGenes, index, geneIndex, selectedOption, optionType) => {
    const newGenes = [...genes];
    if (optionType === 'gender') {
      newGenes[index].gender = selectedOption;
    } else {
      newGenes[index].genes[geneIndex] = selectedOption;
    }
    setGenes(newGenes);
  };

  // Function to add a new row for parents or targets
  const handleAddRow = (setGenes, defaultRow) => {
    setGenes(prevGenes => [...prevGenes, defaultRow]);
  };

  // Function to remove a row
  const handleRemoveRow = (setGenes, index) => {
    setGenes(prevGenes => prevGenes.filter((_, i) => i !== index));
  };

  // Function to toggle the expansion of result rows
  const toggleExpand = (index) => {
    setExpanded((prevState) => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format the data for submission
    const formattedParents = parentGenes.map(item => [item.gender, ...item.genes]);
    const formattedTargets = targetGenes.map(item => [item.gender, ...item.genes]);

    setError('');
    setResult(null);

    try {
      // Send the data to the Flask backend
      const response = await axios.post('generate_children', {
        parents: formattedParents,
        targets: formattedTargets
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
        {/* Parent Genes Section */}
        <h3>Parents' Genes</h3>
        {parentGenes.map((parent, index) => (
          <div key={index} className="gene-row">

            {/* Gender Slider */}
            <SliderToggle
              options={genderOptions}
              selectedOption={parent.gender}
              onChange={(option) => handleToggle(parentGenes, setParentGenes, index, null, option, 'gender')}
            />

            {/* Gene A Slider */}
            <SliderToggle
              options={geneAOptions}
              selectedOption={parent.genes[0]}
              onChange={(option) => handleToggle(parentGenes, setParentGenes, index, 0, option, 'gene')}
            />

            {/* Gene B Slider */}
            <SliderToggle
              options={geneBOptions}
              selectedOption={parent.genes[1]}
              onChange={(option) => handleToggle(parentGenes, setParentGenes, index, 1, option, 'gene')}
            />

            {/* Gene C Slider */}
            <SliderToggle
              options={geneCOptions}
              selectedOption={parent.genes[2]}
              onChange={(option) => handleToggle(parentGenes, setParentGenes, index, 2, option, 'gene')}
            />

            {/* Remove Parent Button */}
            {parentGenes.length > 1 && (
              <button type="button" onClick={() => handleRemoveRow(setParentGenes, index)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => handleAddRow(setParentGenes, { gender: 'm', genes: ['Aa', 'Bb', 'Cc'] })}>
          Add Another Parent
        </button>

{/* Target Genes Section */}
<h3>Target Genes for Children</h3>
{targetGenes.map((target, index) => (
  <div key={index} className="gene-row">

    {/* Gender Slider */}
    <SliderToggle
      options={genderOptions}
      selectedOption={target.gender}
      onChange={(option) => handleToggle(targetGenes, setTargetGenes, index, null, option, 'gender')}
    />

    {/* Gene A Slider */}
    <SliderToggle
      options={geneAOptions}
      selectedOption={target.genes[0]}
      onChange={(option) => handleToggle(targetGenes, setTargetGenes, index, 0, option, 'gene')}
    />

    {/* Gene B Slider */}
    <SliderToggle
      options={geneBOptions}
      selectedOption={target.genes[1]}
      onChange={(option) => handleToggle(targetGenes, setTargetGenes, index, 1, option, 'gene')}
    />

    {/* Gene C Slider */}
    <SliderToggle
      options={geneCOptions}
      selectedOption={target.genes[2]}
      onChange={(option) => handleToggle(targetGenes, setTargetGenes, index, 2, option, 'gene')}
    />

    {/* Always show Remove Target Button */}
    <button type="button" onClick={() => handleRemoveRow(setTargetGenes, index)}>
      Remove
    </button>
  </div>
))}
<button type="button" onClick={() => handleAddRow(setTargetGenes, { gender: 'm', genes: ['AA', 'BB', 'CC'] })}>
  Add Another Target
</button>


        <button type="submit">Submit</button>
      </form>

      {error && <p className="error">{error}</p>}

      {/* Display the result */}
      {result && result.length > 0 && (
        <div className="result">
          <h3>Generated Children Results</h3>
          {result.map((res, index) => {
            if (!res || !res.childs || Object.keys(res).length === 0) return null;

            return (
              <div key={index} className="result-summary">
                <div className="summary-row" onClick={() => toggleExpand(index)}>
                  <h4>
                    Parents: Male ({res.father ? res.father.join(', ') : 'Unknown'}) and Female ({res.mother ? res.mother.join(', ') : 'Unknown'})
                  </h4>
                  <p>Sum Probability: {res.sum}</p>
                  <button type="button">{expanded[index] ? 'Hide Details' : 'Show Details'}</button>
                </div>

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
