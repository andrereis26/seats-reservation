import { useParams } from "react-router-dom";

const StatsPage = () => {
    const { id } = useParams();

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Statistics for Event {id}</h1>
            <p>Here we’ll show stats like % of seats taken per section/event.</p>
        </div>
    );
};

export default StatsPage;
