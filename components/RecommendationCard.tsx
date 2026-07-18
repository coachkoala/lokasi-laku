interface RecommendationCardProps {
  recommendation: {
    id: string;
    category: string;
    score: string;
    scoreType: "hot" | "medium" | "low";
    description: string;
    competitors: number;
    avgRating: number | null;
  };
  selected: boolean;
  onSelect: () => void;
}

export default function RecommendationCard({
  recommendation,
  selected,
  onSelect,
}: RecommendationCardProps) {
  const scoreTypeClass = recommendation.scoreType === "hot" ? "hot" : recommendation.scoreType === "low" ? "low" : "";

  return (
    <div
      className={`insight-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      data-target={recommendation.id}
    >
      <div className="ic-head">
        <h4>{recommendation.category}</h4>
        <span className={`ic-score ${scoreTypeClass}`}>{recommendation.score}</span>
      </div>
      <div className="ic-body">{recommendation.description}</div>
      <div className="ic-meta">
        <span>{recommendation.competitors} kompetitor</span>
        <span>
          {recommendation.avgRating ? `★ ${recommendation.avgRating.toFixed(1)} rata-rata` : "— belum ada data"}
        </span>
      </div>
    </div>
  );
}
