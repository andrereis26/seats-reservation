import { useParams } from "react-router-dom";
import { calculateFieldSize, type Stadium } from "../utils/generateStadium";

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
        <SideView sideName="Up" side={stadium.sides.up} orientation="horizontal" />

        <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
          {/* Left Side (rotated) */}
          <div style={{ transform: "rotate(90deg)" }}>
            <SideView
              sideName="Left"
              side={stadium.sides.left}
              orientation="vertical"
            />
          </div>

          {/* "Field" placeholder */}
          <div
            style={{
              width: `${stadium.field?.width || width}px`,
              height: `${stadium.field?.height || height}px`,
              background: "lightgreen",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            Field
          </div>

          {/* Right Side (rotated opposite) */}
          <div style={{ transform: "rotate(-90deg)" }}>
            <SideView
              sideName="Right"
              side={stadium.sides.right}
              orientation="vertical"
            />
          </div>
        </div>

        {/* Bottom Side */}
        <SideView sideName="Down" side={stadium.sides.down} orientation="horizontal" />
      </div>
    </div>
  );
}

function SideView({ sideName, side, orientation }: any) {
  const isVertical = orientation === "vertical";

  return (
    <div>
      <h4 style={{ textAlign: "center" }}>{sideName}</h4>
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
