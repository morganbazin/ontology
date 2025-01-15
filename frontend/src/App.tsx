// Frontend (React + TypeScript)
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Work {
  id: number;
  title: string;
  creator: string;
  type: string;
  genre: string;
}

const App: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  useEffect(() => {
    axios
      .get("http://localhost:3001/works")
      .then((response) => {
        setWorks(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleSelectWork = (id: number) => {
    axios.get(`http://localhost:3001/works/${id}`).then((response) => {
      setSelectedWork(response.data);
    });
  };

  return (
    <div
      className="App"
      style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}
    >
      <h1>Ontology of Cultural Works</h1>
      <h2>List of Works</h2>
      <ul>
        {works.map((work) => (
          <li key={work.id}>
            <button
              style={{
                background: "lightblue",
                border: "none",
                padding: "5px",
                cursor: "pointer",
              }}
              onClick={() => handleSelectWork(work.id)}
            >
              {work.title}
            </button>
          </li>
        ))}
      </ul>
      {selectedWork && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid gray",
          }}
        >
          <h2>Details</h2>
          <p>
            <strong>Title:</strong> {selectedWork.title}
          </p>
          <p>
            <strong>Creator:</strong> {selectedWork.creator}
          </p>
          <p>
            <strong>Type:</strong> {selectedWork.type}
          </p>
          <p>
            <strong>Genre:</strong> {selectedWork.genre}
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
