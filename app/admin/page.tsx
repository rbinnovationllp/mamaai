import { AnalyticsService } from "@/lib/services/analytics-service";

function maxValue(items: Array<{ value: number }>) {
  return Math.max(1, ...items.map((item) => item.value));
}

function BarList({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = maxValue(items);
  return (
    <div className="admin-bars">
      {items.length ? (
        items.map((item) => (
          <div className="admin-bar-row" key={item.label}>
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))
      ) : (
        <p className="muted">No analytics events recorded yet.</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const analytics = new AnalyticsService().summary();

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>Website Analytics</h1>
        <p className="lead">
          Privacy-conscious testing analytics for visits, demo engagement, registrations, meal-plan generation and Ask
          MAMA usage.
        </p>
      </section>

      <section className="analytics-cards">
        <div>
          <p className="muted">Today&apos;s Visitors</p>
          <strong>{analytics.cards.todaysVisitors}</strong>
        </div>
        <div>
          <p className="muted">Last 7 Days</p>
          <strong>{analytics.cards.last7Days}</strong>
        </div>
        <div>
          <p className="muted">Last 30 Days</p>
          <strong>{analytics.cards.last30Days}</strong>
        </div>
        <div>
          <p className="muted">Total Visits</p>
          <strong>{analytics.cards.totalVisits}</strong>
        </div>
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <h2>Daily Visitor Trend</h2>
          <BarList items={analytics.charts.dailyVisitorTrend} />
        </article>
        <article className="panel">
          <h2>Most Visited Pages</h2>
          <BarList items={analytics.charts.mostVisitedPages} />
        </article>
        <article className="panel">
          <h2>Traffic Sources</h2>
          <BarList items={analytics.charts.trafficSources} />
        </article>
        <article className="panel">
          <h2>Device Breakdown</h2>
          <BarList items={analytics.charts.deviceBreakdown} />
        </article>
        <article className="panel wide-panel">
          <h2>Visitor to Meal Plan Funnel</h2>
          <BarList items={analytics.charts.conversionFunnel} />
        </article>
        <article className="panel">
          <h2>Product Events</h2>
          <div className="event-metrics">
            <p>Homepage visits: {analytics.eventCounts.homepageVisits}</p>
            <p>Try Demo clicks: {analytics.eventCounts.tryDemoClicks}</p>
            <p>Get Started clicks: {analytics.eventCounts.getStartedClicks}</p>
            <p>Registrations/Create Family: {analytics.eventCounts.registrations}</p>
            <p>Meal plans generated: {analytics.eventCounts.mealPlansGenerated}</p>
            <p>Meal replacements: {analytics.eventCounts.mealReplacements}</p>
            <p>Recipe video requests: {analytics.eventCounts.recipeVideoRequests}</p>
            <p>PWA install prompts: {analytics.eventCounts.pwaInstallPrompts}</p>
            <p>Ask MAMA opens: {analytics.eventCounts.askMamaConversations}</p>
            <p>Ask MAMA questions: {analytics.eventCounts.askMamaQuestions}</p>
            <p>Ask MAMA unresolved: {analytics.eventCounts.askMamaUnresolved}</p>
          </div>
        </article>
        <article className="panel">
          <h2>Ask MAMA Categories</h2>
          <BarList items={analytics.charts.askMamaCategories} />
        </article>
        <article className="panel">
          <h2>AI/API Usage by Plan</h2>
          <p className="muted">{analytics.aiUsage.fairUseNote}</p>
          <BarList items={analytics.aiUsage.byPlanOrCategory} />
        </article>
        <article className="panel">
          <h2>Expensive Operation Mix</h2>
          <p className="muted">Tracked events: {analytics.aiUsage.totalTrackedAiApiEvents}</p>
          <BarList items={analytics.aiUsage.expensiveOperationMix} />
        </article>
      </section>

      <section className="notice">
        <p>{analytics.privacy}</p>
        <p>Page views, visits/sessions and unique visitors are separated because they are different metrics.</p>
      </section>
    </main>
  );
}
