import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './App.css'
import { generateStadium } from "./utils/generateStadium";

function App() {
  const [capacity, setCapacity] = useState(100000);
  const [widthPercent, setWidthPercent] = useState(60);
  const [lengthPercent, setLengthPercent] = useState(40);
  const [sectionsPerSide, setSectionsPerSide] = useState(2);
  const [rowsPerSection, setRowsPerSection] = useState(10);
  const [seatsPerRow, setSeatsPerRow] = useState(20);

  const navigate = useNavigate();

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthPercent(Number(e.target.value));
    setLengthPercent(100 - Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stadium = generateStadium(
      capacity,
      widthPercent,
      sectionsPerSide,
      rowsPerSection,
      seatsPerRow
    );

    // store stadium in sessionStorage (or context)
    localStorage.setItem("stadium", JSON.stringify(stadium));

    const randomId = Math.floor(Math.random() * 1000);
    navigate(`/event/${randomId}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "600px" }}>
      <label>Capacity <input type="number" value={capacity} onChange={(e) => setCapacity(+e.target.value)} /></label>
      <label>Width % <input type="number" value={widthPercent} onChange={(e) => handleWidthChange(e)} /></label>
      <label>Length % <input type="number" value={lengthPercent} disabled={true} /></label>
      <label>Sections per Side <input type="number" value={sectionsPerSide} onChange={(e) => setSectionsPerSide(+e.target.value)} /></label>
      <label>Rows per Section <input type="number" value={rowsPerSection} onChange={(e) => setRowsPerSection(+e.target.value)} /></label>
      <label>Seats per Row <input type="number" value={seatsPerRow} onChange={(e) => setSeatsPerRow(+e.target.value)} /></label>
      <button type="submit" style={{ backgroundColor: "green", color: "white" }}>Generate Stadium</button>
    </form>
  );
}

export default App;
