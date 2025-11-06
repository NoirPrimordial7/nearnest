import { useParams } from "react-router-dom";

export default function StoreDashboard() {
  const { id } = useParams();
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
    }}>
      <h1>🏪 Store Dashboard</h1>
      <p>Currently viewing store: {id}</p>
    </div>
  );
}
