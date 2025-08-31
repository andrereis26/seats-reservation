import { useParams } from "react-router-dom";
import { calculateFieldSize, type Stadium } from "../utils/generateStadium";
import { useState } from "react";

export default function Event() {
  const { id } = useParams();
  const stadium: Stadium = JSON.parse(localStorage.getItem("stadium") || "{}");

  if (!stadium?.sides) return <p>No stadium generated yet.</p>;

  const { width, height } = calculateFieldSize(stadium); // automatic calculation of field size

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
          <SideView side={stadium.sides.up} orientation="horizontal" />
        </div>

        {/* Middle Row: Left side, Field, Right side */}
        <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
          {/* Left Side */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ transform: "rotate(90deg)" }}>
              <SideView side={stadium.sides.left} orientation="vertical" />
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
              <SideView side={stadium.sides.right} orientation="vertical" />
            </div>
          </div>
        </div>

        {/* Bottom Side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SideView side={stadium.sides.down} orientation="horizontal" />
        </div>
      </div>

      {/* Confirmation button */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          style={{ backgroundColor: "blue", color: "white" }}
          onClick={() => {
          }}
        >
          Confirm Seats
        </button>
      </div>
    </div>
  );
}

function SideView({ side, orientation }: any) {
  const isVertical = orientation === "vertical";
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  // when seat is handle, change its color
  const handleHoverSeat = (e: React.MouseEvent<HTMLDivElement>, isHover: boolean) => {
    const target = e.currentTarget;
    const isSeatSelected = selectedSeats.has(target.getAttribute("data-id") || "");

    // only change the color if the seat is not selected
    if (target && !isSeatSelected) {
      target.style.background = isHover ? "yellow" : (target.getAttribute("data-status") === "free" ? "green" : "red");
    }
  };

  // handle user seat selection
  const handleSelectSeat = (e: React.MouseEvent<HTMLDivElement>, seatId: string) => {
    e.stopPropagation();
    const target = e.currentTarget;

    setSelectedSeats((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(seatId)) {
        target.style.background = "green";
        newSelected.delete(seatId);
      } else {
        target.style.background = "yellow";
        newSelected.add(seatId);
      }
      return newSelected;
    });
  };

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
                      background: seat.status === "free" ? "green" : "red",
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
