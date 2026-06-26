import { useState, useEffect, useRef } from "react";

const OPTIONS = [
  {
    value: 1,
    labelRo: "Distant",
    labelEn: "Distant",
    descRo: "Se simte departe acum",
    descEn: "Feels far away right now",
  },
  {
    value: 2,
    labelRo: "În căutare",
    labelEn: "Searching",
    descRo: "Caut, dar nu sunt sigur că sunt aproape",
    descEn: "Reaching, but not sure I'm close",
  },
  {
    value: 3,
    labelRo: "Prezent",
    labelEn: "Present",
    descRo: "Stabil, conștient, la mijloc",
    descEn: "Steady, aware, in the middle",
  },
  {
    value: 4,
    labelRo: "Aproape",
    labelEn: "Near",
    descRo: "Apropiat, conectat",
    descEn: "Close, connected",
  },
  {
    value: 5,
    labelRo: "Ținut",
    labelEn: "Held",
    descRo: "Profund, deplin conectat",
    descEn: "Deeply, fully connected",
  },
];

const STORAGE_KEY = "closeness-poll:votes";

export default function ClosenessPoll() {
  const [votes, setVotes] = useState(null); // { "1": n, "2": n, ... }
  const [myVote, setMyVote] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const loadVotes = async () => {
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      if (result && result.value) {
        setVotes(JSON.parse(result.value));
      } else {
        setVotes({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 });
      }
      setError(null);
    } catch (e) {
      setVotes({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 });
      setError(null);
    }
  };

  useEffect(() => {
    loadVotes().finally(() => setLoading(false));
    pollRef.current = setInterval(loadVotes, 4000);
    return () => clearInterval(pollRef.current);
  }, []);

  const castVote = async (value) => {
    if (myVote !== null) return;
    setMyVote(value);

    let current;
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      current = result && result.value
        ? JSON.parse(result.value)
        : { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    } catch (e) {
      current = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    }
    current[String(value)] = (current[String(value)] || 0) + 1;

    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(current), true);
      setVotes(current);
    } catch (e) {
      setError("Your response didn't save. Please try again.");
      setMyVote(null);
    }
  };

  const resetMyVote = () => {
    setMyVote(null);
    setViewOnly(false);
  };

  const enterViewOnly = () => setViewOnly(true);

  const total = votes ? Object.values(votes).reduce((a, b) => a + b, 0) : 0;
  const maxCount = votes ? Math.max(1, ...Object.values(votes)) : 1;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Work+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @media (prefers-reduced-motion: reduce) {
          .fade-in, .glow-pulse, .bar-fill { transition: none !important; animation: none !important; }
        }
        .option-btn:focus-visible, .reset-btn:focus-visible, .view-only-btn:focus-visible {
          outline: 2px solid #2D6CC4;
          outline-offset: 3px;
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: riseIn 0.5s ease forwards; }
      `}</style>

      <div style={styles.container}>
        <div style={{ ...styles.eyebrow, ...fade(0) }}>UN MOMENT DE LINIȘTE · A MOMENT TO PAUSE</div>
        <h1 style={{ ...styles.question, ...fade(1) }}>
          Cât de aproape te simți de Dumnezeu chiar acum?
        </h1>
        <h2 style={{ ...styles.questionEn, ...fade(1) }}>
          Right now, how close do you feel to God?
        </h2>
        <p style={{ ...styles.sub, ...fade(2) }}>
          Nu există un răspuns corect. Doar locul în care ești, în acest moment.
          <br />
          There's no right answer. Just where you are, this moment.
        </p>

        {loading ? (
          <div style={styles.loadingText}>Se aprinde calea… · Lighting the path…</div>
        ) : myVote === null && !viewOnly ? (
          <>
            <PathSelector onSelect={castVote} />
            <button style={styles.viewOnlyLink} className="view-only-btn" onClick={enterViewOnly}>
              Vezi rezultatele fără să votezi · View results without voting
            </button>
          </>
        ) : (
          <ResultPath votes={votes} total={total} maxCount={maxCount} myVote={myVote} viewOnly={viewOnly} />
        )}

        {error && <div style={styles.errorText}>{error}</div>}

        {(myVote !== null || viewOnly) && (
          <button style={styles.resetBtn} className="reset-btn" onClick={resetMyVote}>
            {myVote !== null ? "↺ Răspunde din nou · Answer again" : "↺ Înapoi la vot · Back to vote"}
          </button>
        )}

        <div style={styles.footer}>
          {total > 0
            ? `${total} ${total === 1 ? "răspuns" : "răspunsuri"} până acum · ${total} ${total === 1 ? "response" : "responses"} so far`
            : "Fii primul care răspunde · Be the first to respond"}
        </div>
      </div>
    </div>
  );
}

function fade(i) {
  return { animation: `riseIn 0.5s ease ${i * 0.08}s forwards`, opacity: 0 };
}

function PathSelector({ onSelect }) {
  return (
    <div style={styles.pathWrap} className="fade-in" >
      <div style={styles.pathLine} />
      <div style={styles.pathRow}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className="option-btn"
            style={styles.dotBtn}
            onClick={() => onSelect(opt.value)}
            aria-label={`${opt.value} - ${opt.labelRo} / ${opt.labelEn}: ${opt.descRo} / ${opt.descEn}`}
          >
            <span style={styles.dotOuter(opt.value)}>
              <span style={styles.dotInner}>{opt.value}</span>
            </span>
            <span style={styles.dotLabel}>{opt.labelRo}</span>
            <span style={styles.dotLabelEn}>{opt.labelEn}</span>
            <span style={styles.dotDesc}>{opt.descRo}</span>
            <span style={styles.dotDescEn}>{opt.descEn}</span>
          </button>
        ))}
      </div>
      <div style={styles.pathEnds}>
        <span>departe · far</span>
        <span>aproape · near</span>
      </div>
    </div>
  );
}

function ResultPath({ votes, total, maxCount, myVote, viewOnly }) {
  const mine = myVote !== null ? OPTIONS[myVote - 1] : null;
  return (
    <div style={styles.resultWrap} className="fade-in">
      {viewOnly ? (
        <div style={styles.youAnswered}>
          Rezultate live · <span style={styles.youAnsweredEn}>Live results</span>
        </div>
      ) : (
        <div style={styles.youAnswered}>
          Ai răspuns: <strong>{mine.labelRo}</strong>
          <span style={styles.youAnsweredEn}> · You said: {mine.labelEn}</span>
        </div>
      )}

      <div style={styles.barsRow}>
        {OPTIONS.map((opt) => {
          const count = votes[String(opt.value)] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const heightPct = Math.max(6, (count / maxCount) * 100);
          const isMine = opt.value === myVote;
          return (
            <div key={opt.value} style={styles.barCol}>
              <div style={styles.barPct}>{total > 0 ? `${pct}%` : "—"}</div>
              <div style={styles.barTrack}>
                <div
                  className="bar-fill"
                  style={styles.barFill(heightPct, isMine)}
                />
              </div>
              <div style={styles.barDot(isMine)}>{opt.value}</div>
              <div style={styles.barLabel(isMine)}>{opt.labelRo}</div>
              <div style={styles.barLabelEn(isMine)}>{opt.labelEn}</div>
              <div style={styles.barCount}>{count}</div>
            </div>
          );
        })}
      </div>
      <div style={styles.pathEnds}>
        <span>departe · far</span>
        <span>aproape · near</span>
      </div>
    </div>
  );
}

const INK = "#1B3A6B";
const PARCHMENT = "#EAF1FB";
const GOLD = "#2D6CC4";
const CLAY = "#5FA0E0";
const CREAM = "#FFFFFF";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: `radial-gradient(ellipse at top, #FFFFFF 0%, ${PARCHMENT} 60%, #DCE9FA 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    fontFamily: "'Work Sans', sans-serif",
  },
  container: {
    maxWidth: 640,
    width: "100%",
    textAlign: "center",
  },
  eyebrow: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: "0.18em",
    fontWeight: 600,
    marginBottom: 18,
  },
  question: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: "italic",
    fontWeight: 500,
    color: INK,
    fontSize: "clamp(28px, 5vw, 42px)",
    lineHeight: 1.25,
    margin: "0 0 4px 0",
  },
  questionEn: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: "italic",
    fontWeight: 400,
    color: "rgba(27,58,107,0.55)",
    fontSize: "clamp(16px, 2.6vw, 21px)",
    lineHeight: 1.3,
    margin: "0 0 14px 0",
  },
  sub: {
    color: "rgba(27,58,107,0.6)",
    fontSize: 15,
    marginBottom: 44,
    fontWeight: 400,
  },
  loadingText: {
    color: "rgba(27,58,107,0.5)",
    fontSize: 14,
    padding: "60px 0",
  },
  errorText: {
    color: "#e8a895",
    fontSize: 13,
    marginTop: 16,
  },
  pathWrap: {
    position: "relative",
    padding: "10px 0 28px",
  },
  pathLine: {
    position: "absolute",
    top: 34,
    left: "8%",
    right: "8%",
    height: 1,
    background: `linear-gradient(90deg, rgba(45,108,196,0.15), ${GOLD}, rgba(45,108,196,0.15))`,
  },
  pathRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 4,
    position: "relative",
    zIndex: 1,
  },
  dotBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    padding: "0 2px",
    transition: "transform 0.2s ease",
  },
  dotOuter: (v) => ({
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.15), transparent 60%), linear-gradient(145deg, ${GOLD}, ${CLAY})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 0 0 1px rgba(45,108,196,0.35), 0 8px 20px -6px rgba(27,58,107,0.35)`,
    marginBottom: 12,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  }),
  dotInner: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 24,
    fontWeight: 600,
    color: CREAM,
  },
  dotLabel: {
    color: INK,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 1,
  },
  dotLabelEn: {
    color: "rgba(27,58,107,0.5)",
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 4,
    fontStyle: "italic",
  },
  dotDesc: {
    color: "rgba(27,58,107,0.5)",
    fontSize: 11,
    lineHeight: 1.3,
    maxWidth: 96,
  },
  dotDescEn: {
    color: "rgba(27,58,107,0.32)",
    fontSize: 10,
    lineHeight: 1.3,
    maxWidth: 96,
    fontStyle: "italic",
    marginTop: 2,
  },
  pathEnds: {
    display: "flex",
    justifyContent: "space-between",
    color: "rgba(27,58,107,0.35)",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "0 4px",
    marginTop: 4,
  },
  resultWrap: {
    padding: "4px 0 20px",
  },
  youAnswered: {
    color: "rgba(27,58,107,0.7)",
    fontSize: 14,
    marginBottom: 30,
  },
  youAnsweredEn: {
    color: "rgba(27,58,107,0.45)",
    fontStyle: "italic",
    fontWeight: 400,
  },
  barsRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    height: 200,
    padding: "0 4px",
  },
  barCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  barPct: {
    color: "rgba(27,58,107,0.55)",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: 500,
  },
  barTrack: {
    width: "100%",
    maxWidth: 44,
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    background: "rgba(27,58,107,0.06)",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: (heightPct, isMine) => ({
    width: "100%",
    height: `${heightPct}%`,
    background: isMine
      ? `linear-gradient(180deg, ${GOLD}, ${CLAY})`
      : "linear-gradient(180deg, rgba(45,108,196,0.4), rgba(95,160,224,0.3))",
    borderRadius: 6,
    transition: "height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
  }),
  barDot: (isMine) => ({
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: isMine ? GOLD : "rgba(27,58,107,0.12)",
    color: isMine ? CREAM : INK,
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "10px 0 6px",
  }),
  barLabel: (isMine) => ({
    color: isMine ? GOLD : "rgba(27,58,107,0.6)",
    fontSize: 11,
    fontWeight: 600,
    textAlign: "center",
  }),
  barLabelEn: (isMine) => ({
    color: isMine ? "rgba(45,108,196,0.8)" : "rgba(27,58,107,0.35)",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 1,
  }),
  barCount: {
    color: "rgba(27,58,107,0.35)",
    fontSize: 10,
    marginTop: 2,
  },
  resetBtn: {
    background: "none",
    border: "1px solid rgba(45,108,196,0.3)",
    color: "rgba(27,58,107,0.6)",
    fontSize: 12,
    padding: "8px 18px",
    borderRadius: 20,
    cursor: "pointer",
    marginTop: 18,
    fontFamily: "'Work Sans', sans-serif",
  },
  viewOnlyLink: {
    background: "none",
    border: "none",
    color: "rgba(27,58,107,0.45)",
    fontSize: 12,
    textDecoration: "underline",
    cursor: "pointer",
    marginTop: 22,
    fontFamily: "'Work Sans', sans-serif",
    padding: 0,
  },
  footer: {
    color: "rgba(27,58,107,0.3)",
    fontSize: 12,
    marginTop: 28,
  },
};
