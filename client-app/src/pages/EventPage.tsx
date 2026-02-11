import { useParams } from "react-router-dom";
import { calculateFieldSize, type Stadium } from "../utils/generateStadium";
import { useEffect, useState } from "react";
import gatewayServerSocket from "../socketio/gatewayServerSocket";
import config from "../conf/config";

export default function Event() {
  const { id } = useParams();
  const stadium: Stadium = JSON.parse(localStorage.getItem("stadium") || "{}");
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  // when seat is handle, change its color
  const handleHoverSeat = (e: React.MouseEvent<HTMLDivElement>, isHover: boolean) => {
    const target = e.currentTarget;
    const isSeatSelected = selectedSeats.has(target.getAttribute("data-id") || "");

    // only change the color if the seat is not selected
    if (target && !isSeatSelected) {
      target.style.background = isHover
        ? config.seatStates.selected.color
        : (target.getAttribute("data-status") === config.seatStates.free.value
          ? config.seatStates.free.color
          : config.seatStates.reserved.color);
    }
  };

  // handle user seat selection
  const handleSelectSeat = (e: React.MouseEvent<HTMLDivElement>, seatId: string) => {
    e.stopPropagation();
    const target = e.currentTarget;

    // validate if seat is free before selecting
    if (target.getAttribute("data-status") !== config.seatStates.free.value) {
      return;
    }

    setSelectedSeats((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(seatId)) {
        target.style.background = config.seatStates.free.color;
        newSelected.delete(seatId);
      } else {
        target.style.background = config.seatStates.selected.color;
        newSelected.add(seatId);

        // call gateway to reserve seat 

      }
      return newSelected;
    });
  };

  if (!stadium?.sides) return <p>No stadium generated yet.</p>;

  const { width, height } = calculateFieldSize(stadium); // automatic calculation of field size

  // connect to gateway server and join event room
  useEffect(() => {
    // connect to gateway server
    gatewayServerSocket.connect();

    // join event room
    gatewayServerSocket.emit("joinEvent", { eventId: id });

    // listen for seat reservation updates
    gatewayServerSocket.on("seatReserved", (data: any) => {
      const seatId = data.seatId;
      // update seat status in stadium
      for (const sideKey in stadium.sides) {
        const side = (stadium.sides as any)[sideKey];
        for (const section of side.sections) {
          for (const row of section.rows) {
            for (const seat of row.seats) {
              if (seat.id === seatId) {
                seat.status = config.seatStates.reserved.value;
              }
            }
          }
        }
      }
      // update local storage
      localStorage.setItem("stadium", JSON.stringify(stadium));
      // force re-render
      setSelectedSeats(new Set(selectedSeats));
    });

    return () => {
      gatewayServerSocket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Event {id} - Stadium View</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Top Side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SideView side={stadium.sides.up} orientation="horizontal" handleSelectSeat={handleSelectSeat} handleHoverSeat={handleHoverSeat} />
        </div>

        {/* Middle Row: Left side, Field, Right side */}
        <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
          {/* Left Side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ transform: "rotate(90deg)" }}>
              <SideView side={stadium.sides.left} orientation="vertical" handleSelectSeat={handleSelectSeat} handleHoverSeat={handleHoverSeat} />
            </div>
          </div>

          {/* Field */}
          <div
            style={{
              width: `${stadium.field?.width || width}px`,
              height: `${stadium.field?.height || height}px`,
              background: "lightgray",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "24px",
            }}
          >
            Field
          </div>

          {/* Right Side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ transform: "rotate(-90deg)" }}>
              <SideView side={stadium.sides.right} orientation="vertical" handleSelectSeat={handleSelectSeat} handleHoverSeat={handleHoverSeat} />
            </div>
          </div>
        </div>

        {/* Bottom Side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SideView side={stadium.sides.down} orientation="horizontal" handleSelectSeat={handleSelectSeat} handleHoverSeat={handleHoverSeat} />
        </div>
      </div>

      {/* Confirmation button */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          style={{ backgroundColor: selectedSeats.size > 0 ? "blue" : "gray", color: "white" }}
          onClick={() => {
          }}
          disabled={selectedSeats.size === 0}
        >
          Confirm Seats
        </button>
      </div>
    </div>
  );
}

function SideView({ side, orientation, handleSelectSeat, handleHoverSeat }: any) {
  const isVertical = orientation === "vertical";

  return (
    <div style={{ marginBottom: isVertical ? "-14px" : "4px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: "6px",
        }}
      >
        {side.sections.map((section: any) => (
          <div
            key={section.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "center",
            }}
          >
            {section.rows.map((row: any) => (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {row.seats.map((seat: any) => (
                  <div
                    key={seat.id}
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      background: seat.status === config.seatStates.free.value ? config.seatStates.free.color : config.seatStates.reserved.color,
                    }}
                    data-id={seat.id}
                    data-status={seat.status}
                    onMouseEnter={(e) => handleHoverSeat(e, true)}
                    onMouseLeave={(e) => handleHoverSeat(e, false)}
                    onClick={(e) => handleSelectSeat(e, seat.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
