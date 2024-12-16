import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import DropdownMenu from "./DropDownMenu.js";
import "../App.css";
import Modal from "./Modal";

function MyCalendar() {
  const [date, setDate] = useState(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [databases, setDatabases] = useState([]); // Lista med databaser
  const [selectedDatabase, setSelectedDatabase] = useState(""); // Vald databas
  const [selectedCollection, setSelectedCollection] = useState(""); // Vald kollektion
  const [attributes, setAttributes] = useState([]); // Attribut för vald kollektion
  const [events, setEvents] = useState([]); // Alla event från backend

  const handleDateClick = (clickedDate) => {
    setDate(clickedDate);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Hämta listan med databaser från backend
  const fetchDatabases = async () => {
    try {
      const response = await fetch("http://localhost:8000/databases");
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error("Error fetching databases:", error);
    }
  };

  // Hämta listan med event från backend
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:8000/aidetection");
      const data = await response.json();
      // Formatera event-data
      const formattedEvents = data.map((event) => ({
        date: event.TS.split("T")[0], // TS till YYYY-MM-DD
        time: event.TS.split("T")[1].split(".")[0], // Tidsdelsformat till HH:mm:ss
        prediction: event.prediction,
        database: event.database,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching aiDetection events:", error);
    }
  };

  // Uppdatera dropdown-menyn baserat på vald databas
  const handleDatabaseChange = async (databaseName) => {
    setSelectedDatabase(databaseName);
    try {
      const response = await fetch(
        `http://localhost:8000/databases/${databaseName}/collections`
      );
      const collections = await response.json();
      setAttributes(collections); // Uppdatera kollektionsval
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  // Anpassa vad som visas på varje datum i kalendern
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const formattedDate = date.toISOString().split("T")[0]; // Datum i YYYY-MM-DD-format
      const dayEvents = events.filter((event) => event.date === formattedDate); // Filtrera event för datumet
      const uniqueDatabases = [...new Set(dayEvents.map((event) => event.database))]; // Filtrera unika databaser
  
      if (uniqueDatabases.length > 0) {
        return (
          <div className="tile-content">
            {uniqueDatabases.map((database, index) => (
              <p key={index} className="event-marker">
                {database}
              </p>
            ))}
          </div>
        );
      }
    }
    return null; // Inget innehåll om inga events
  };

  // Hämta databaser och event när komponenten laddas
  useEffect(() => {
    fetchDatabases();
    fetchEvents();
  }, []);

  return (
    <div className="calendar-container">
      <div className="left-panel">
        <DropdownMenu
          databases={databases}
          onDatabaseChange={handleDatabaseChange}
          onCollectionChange={setSelectedCollection}
          attributes={attributes}
        />
      </div>
      <div className="calendar">
        <h1>Event Calendar</h1>
        <Calendar
          onChange={(clickedDate) => handleDateClick(clickedDate)}
          value={date}
          showNeighboringMonth={false}
          tileContent={tileContent} // Anpassad logik för tileContent
        />
        <p>Valt datum: {date.toDateString()}</p>
      </div>
      <Modal
        isVisible={isModalVisible}
        onClose={closeModal}
        content={
          <div>
            <h2>Event för {date.toDateString()}</h2>
            <ul>
              {events
                .filter((event) => event.date === date.toISOString().split("T")[0])
                .map((event, index) => (
                  <li key={index}>
                    <strong>Time:</strong> {event.time} <br />
                    <strong>Database:</strong> {event.database} <br />
                    <strong>Prediction:</strong> {event.prediction}
                    {/* Lägg till fler detaljer om eventet här om tillgängligt */}
                  </li>
                ))}
            </ul>
          </div>
        }
      />
    </div>
  );
}

export default MyCalendar;
