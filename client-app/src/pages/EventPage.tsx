import { useParams } from "react-router-dom";
import type { Stadium } from "../utils/generateStadium";

export default function Event() {
    const { id } = useParams();
    const stadium: Stadium = JSON.parse(sessionStorage.getItem("stadium") || "{}");

    if (!stadium?.sides) return <p>No stadium generated yet.</p>;

    return (
        <div>
            <h2>Event {id} – Seats</h2>
            {Object.entries(stadium.sides).map(([sideName, side]) => (
                <div key={sideName}>
                    <h3>{sideName.toUpperCase()}</h3>
                    {side.sections.map((section) => (
                        <div key={section.id} style={{ marginBottom: "12px" }}>
                            <h4>{section.id}</h4>
                            {section.rows.map((row) => (
                                <div key={row.id} style={{ display: "flex" }}>
                                    {row.seats.map((seat) => (
                                        <div
                                            key={seat.id}
                                            style={{
                                                width: "12px",
                                                height: "12px",
                                                borderRadius: "50%",
                                                margin: "2px",
                                                background: seat.status === "free" ? "green" : "red",
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
