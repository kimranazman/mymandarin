import { SRS_LEVELS, type SRSLevel, type QuizSession } from '../types/vocabulary';
import './Statistics.css';

interface StatisticsProps {
  stats: {
    totalWords: number;
    levelCounts: Record<SRSLevel, number>;
    masteredCount: number;
    learningCount: number;
    newCount: number;
    accuracy: number;
    dueToday: number;
    quizHistory: QuizSession[];
    totalReviews: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string;
  };
  onStartReview: () => void;
}

export function Statistics({ stats, onStartReview }: StatisticsProps) {
  const {
    totalWords,
    levelCounts,
    masteredCount,
    learningCount,
    newCount,
    accuracy,
    dueToday,
    quizHistory,
    totalReviews,
    currentStreak,
    longestStreak,
  } = stats;

  // Calculate mastery percentage
  const masteryPercentage = totalWords > 0
    ? Math.round((masteredCount / totalWords) * 100)
    : 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get recent quiz sessions (last 5)
  const recentSessions = quizHistory.slice(0, 5);

  return (
    <div className="statistics-container">
      <h2 className="stats-title">Your Progress</h2>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="overview-card streak">
          <span className="overview-icon">🔥</span>
          <span className="overview-value">{currentStreak}</span>
          <span className="overview-label">Day Streak</span>
          {longestStreak > currentStreak && (
            <span className="overview-sub">Best: {longestStreak}</span>
          )}
        </div>

        <div className="overview-card reviews">
          <span className="overview-icon">📚</span>
          <span className="overview-value">{totalReviews}</span>
          <span className="overview-label">Total Reviews</span>
        </div>

        <div className="overview-card accuracy">
          <span className="overview-icon">🎯</span>
          <span className="overview-value">{accuracy}%</span>
          <span className="overview-label">Accuracy</span>
        </div>

        <div className="overview-card due">
          <span className="overview-icon">📝</span>
          <span className="overview-value">{dueToday}</span>
          <span className="overview-label">Due Today</span>
        </div>
      </div>

      {/* Review CTA */}
      {dueToday > 0 && (
        <div className="review-cta">
          <p>You have <strong>{dueToday} words</strong> ready for review!</p>
          <button className="btn-start-review" onClick={onStartReview}>
            Start Review Session
          </button>
        </div>
      )}

      {/* Mastery Progress */}
      <div className="mastery-section">
        <h3>Mastery Progress</h3>
        <div className="mastery-bar-container">
          <div className="mastery-bar">
            {([0, 1, 2, 3, 4, 5] as SRSLevel[]).map((level) => {
              const count = levelCounts[level];
              const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0;
              if (percentage === 0) return null;

              return (
                <div
                  key={level}
                  className="mastery-segment"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: SRS_LEVELS[level].color,
                  }}
                  title={`${SRS_LEVELS[level].name}: ${count} words`}
                />
              );
            })}
          </div>
          <div className="mastery-percentage">{masteryPercentage}% Mastered</div>
        </div>

        {/* Level Legend */}
        <div className="level-legend">
          {([0, 1, 2, 3, 4, 5] as SRSLevel[]).map((level) => (
            <div key={level} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: SRS_LEVELS[level].color }}
              />
              <span className="legend-label">{SRS_LEVELS[level].name}</span>
              <span className="legend-count">{levelCounts[level]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Word Distribution */}
      <div className="distribution-section">
        <h3>Word Distribution</h3>
        <div className="distribution-cards">
          <div className="dist-card new">
            <span className="dist-value">{newCount}</span>
            <span className="dist-label">New</span>
          </div>
          <div className="dist-card learning">
            <span className="dist-value">{learningCount}</span>
            <span className="dist-label">Learning</span>
          </div>
          <div className="dist-card mastered">
            <span className="dist-value">{masteredCount}</span>
            <span className="dist-label">Mastered</span>
          </div>
        </div>
      </div>

      {/* Recent Quiz History */}
      {recentSessions.length > 0 && (
        <div className="history-section">
          <h3>Recent Quizzes</h3>
          <div className="history-list">
            {recentSessions.map((session) => {
              const percentage = Math.round(
                (session.correctAnswers / session.totalQuestions) * 100
              );
              const modeLabel = {
                'character-to-meaning': '字 → Meaning',
                'meaning-to-character': 'Meaning → 字',
                'pinyin-to-character': 'Pinyin → 字',
                'flashcard': 'Flashcards',
              }[session.mode];

              return (
                <div key={session.id} className="history-item">
                  <div className="history-main">
                    <span className="history-mode">{modeLabel}</span>
                    <span className="history-date">{formatDate(session.date)}</span>
                  </div>
                  <div className="history-result">
                    <span className="history-score">{percentage}%</span>
                    <span className="history-details">
                      {session.correctAnswers}/{session.totalQuestions}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalReviews === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🌱</span>
          <h3>Start Learning!</h3>
          <p>Complete your first quiz or flashcard session to see your progress here.</p>
        </div>
      )}
    </div>
  );
}
