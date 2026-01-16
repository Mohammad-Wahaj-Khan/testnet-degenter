// import Dashboard from "./components/Dashboard/Dashboard";
import Dashboard from "./components/Dashboard/Dashboard";
import Navbar from "./components/navbar";
import TopMarketToken from "./components/TopMarketToken";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 z-1 h-60"
          style={{
            backgroundImage: `
            linear-gradient(
              120deg,
              #14624F 0%,
              #29a789ff 36.7%,
              #bd361eff 66.8%,
              #2D1B45 100%
            )
          `,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Grain/Noise Overlay */}
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGZpbHRlciBpZD0ibm9pc2UiIHg9IjAlIiB5PSIwJSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOTgiIG51bU9jdGF2ZXM9IjUiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIvPjwvc3ZnPg==")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />

          {/* Fade overlay to blend bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black"></div>
        </div>
        <div className="z-10">
          <Navbar />
          <TopMarketToken />
          <Dashboard />
        </div>
      </main>
    </>
  );
}
