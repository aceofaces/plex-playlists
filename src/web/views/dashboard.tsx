/**
 * Dashboard - main landing page
 * TSX version with pure JSX composition
 */

import Html from '@kitajs/html';
import { Layout } from './layout.tsx';

interface Playlist {
  id: number;
  window: string;
  title: string | null;
  trackCount: number;
  generatedAt: Date;
  plexRatingKey: string | null;
}

interface JobRun {
  id: number;
  window: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
}

interface CacheStats {
  total: number;
  bySource: Record<string, number>;
  expired: number;
}

export interface DashboardPageProps {
  playlists: Playlist[];
  dailyPlaylists: Playlist[];
  genrePlaylists: Playlist[];
  jobs: JobRun[];
  cacheStats: CacheStats;
  setupComplete: boolean;
  page: string;
}

function timeAgo(date: Date): JSX.Element {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return seconds + 's ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

function getPlaylistIcon(window: string): JSX.Element {
  if (window === 'morning') return '🌅';
  if (window === 'afternoon') return '☀️';
  if (window === 'evening') return '🌙';
  return '🎵';
}

export function DashboardPage(props: DashboardPageProps) {
  const {
    playlists,
    dailyPlaylists,
    genrePlaylists,
    jobs,
    cacheStats,
    setupComplete,
    page
  } = props;

  // Calculate recent errors
  const recentErrors = jobs.filter(j => j.status === 'failed').slice(0, 3);
  const last24hErrors = jobs.filter(j => {
    const jobTime = new Date(j.startedAt).getTime();
    const now = Date.now();
    return j.status === 'failed' && (now - jobTime) < 24 * 60 * 60 * 1000;
  });

  return (
    <Layout title="Dashboard" page={page} setupComplete={setupComplete}>
      <div>
        <h2>Dashboard</h2>

        {/* Setup Wizard Banner */}
        {!setupComplete && (
          <div style="background: var(--pico-primary); padding: var(--spacing-normal); border-radius: 0.5rem; margin-bottom: var(--spacing-section);">
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">👋 Welcome! Let's get you set up</h3>
            <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem;">
              Run the setup wizard to configure your playlist generator and learn about all the features.
            </p>
            <a href="/setup" role="button" style="margin: 0;">Start Setup Wizard →</a>
          </div>
        )}

        {/* Stats Overview */}
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--spacing-normal);">
          <div class="stat-card">
            <h3>{playlists.length}</h3>
            <p>Total Playlists</p>
            <small style="color: var(--pico-muted-color); font-size: 0.8rem;">
              {dailyPlaylists.length} daily, {genrePlaylists.length} genre
            </small>
          </div>
          <div class="stat-card">
            <h3>{playlists.reduce((sum, p) => sum + p.trackCount, 0)}</h3>
            <p>Total Tracks</p>
          </div>
          <div class="stat-card">
            <h3>{jobs.filter(j => j.status === 'success').length}/{jobs.length}</h3>
            <p>Successful Runs</p>
          </div>
          <div class="stat-card">
            <h3>{cacheStats.total}</h3>
            <p>Cached Artists</p>
          </div>
        </div>

        {/* Recent Errors Alert */}
        {recentErrors.length > 0 && (
          <section style="background: var(--pico-card-background-color); padding: var(--spacing-normal); border-radius: 0.5rem; border-left: 4px solid var(--pico-del-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-compact);">
              <h3 style="margin: 0; color: var(--pico-del-color); font-size: 1.1rem;">⚠️ Recent Errors</h3>
              <div>
                <span style="font-size: 0.875rem; color: var(--pico-muted-color);">
                  {last24hErrors.length} error{last24hErrors.length !== 1 ? 's' : ''} in last 24h
                </span>
                <a href="/actions/history?status=failed" style="font-size: 0.875rem; margin-left: 0.75rem;">View All →</a>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-compact);">
              {recentErrors.map(job => (
                <div style="background: var(--pico-background-color); padding: var(--spacing-compact); border-radius: 0.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: start; gap: var(--spacing-compact);">
                    <div style="flex: 1;">
                      <strong style="color: var(--pico-del-color); font-size: 0.95rem;">{job.window}</strong>
                      <div style="color: var(--pico-muted-color); font-size: 0.85rem; margin-top: 0.25rem;">
                        Failed {timeAgo(job.startedAt)}
                      </div>
                      {job.error && (
                        <div style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--pico-muted-color); font-family: monospace; background: var(--pico-card-background-color); padding: 0.5rem; border-radius: 0.25rem;">
                          {job.error.length > 120 ? job.error.substring(0, 120) + '...' : job.error}
                        </div>
                      )}
                    </div>
                    <form method="POST" action={`/actions/generate/${job.window}`} style="margin: 0;">
                      <button type="submit" class="action-btn secondary" style="margin: 0; white-space: nowrap;" title="Retry playlist generation">
                        🔄 Retry
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Current Playlists */}
        <section>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-normal);">
            <h3 style="margin: 0;">Your Playlists</h3>
            <a href="/playlists" style="font-size: 0.875rem;">View All →</a>
          </div>
          {playlists.length === 0 ? (
            <p style="color: var(--pico-muted-color);">
              No playlists generated yet.
              {' '}<a href="/setup">Run setup wizard</a>{' '}to get started.
            </p>
          ) : (
            <>
              {/* Daily Playlists */}
              {dailyPlaylists.length > 0 && (
                <div style="margin-bottom: 1.5rem;">
                  <h4 style="font-size: 0.875rem; text-transform: uppercase; color: var(--pico-muted-color); margin-bottom: 0.5rem;">
                    Daily Playlists
                  </h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                    {dailyPlaylists.map(p => (
                      <a href={`/playlists/${p.id}`} style="text-decoration: none; color: inherit;">
                        <article style="margin: 0; padding: 1rem; background: var(--pico-card-background-color); border-radius: 0.5rem;">
                          <div style="margin-bottom: 0.5rem;">
                            <strong>{p.title || p.window}</strong>
                          </div>
                          <p style="margin: 0; color: var(--pico-muted-color); font-size: 0.875rem;">
                            {p.trackCount} tracks • {timeAgo(p.generatedAt)}
                          </p>
                        </article>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Playlists */}
              {genrePlaylists.length > 0 && (
                <div>
                  <h4 style="font-size: 0.875rem; text-transform: uppercase; color: var(--pico-muted-color); margin-bottom: 0.5rem;">
                    Genre Playlists ({genrePlaylists.length})
                  </h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
                    {genrePlaylists.slice(0, 8).map(p => (
                      <a href={`/playlists/${p.id}`} style="text-decoration: none; color: inherit; font-size: 0.875rem;">
                        <div style="padding: 0.5rem; background: var(--pico-background-color); border-radius: 0.25rem;">
                          {p.title || p.window}
                          <span style="color: var(--pico-muted-color);"> • {p.trackCount}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                  {genrePlaylists.length > 8 && (
                    <p style="margin-top: 0.5rem; text-align: center;">
                      <a href="/playlists" style="font-size: 0.875rem;">
                        View all {genrePlaylists.length} genre playlists →
                      </a>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-normal);">
            <h3 style="margin: 0;">Recent Activity</h3>
            <a href="/actions/history" style="font-size: 0.875rem;">View Full History →</a>
          </div>
          {jobs.length === 0 ? (
            <p style="color: var(--pico-muted-color);">No job history yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const duration = job.finishedAt && job.startedAt
                    ? Math.round((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
                    : null;
                  return (
                    <tr>
                      <td>{job.window}</td>
                      <td>
                        <span class={`status-badge status-${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{timeAgo(job.startedAt)}</td>
                      <td>{duration ? duration + 's' : job.status === 'running' ? '...' : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Cache Stats */}
        <section>
          <h3>Genre Cache</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-normal);">
            {Object.entries(cacheStats.bySource).map(([source, count]) => (
              <div class="stat-card">
                <h3>{count}</h3>
                <p>{source}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3>Quick Actions</h3>
          <div style="display: flex; gap: var(--spacing-normal); flex-wrap: wrap;">
            <a href="/playlists" role="button" style="margin: 0;">View All Playlists</a>
            <a href="/actions" role="button" class="secondary" style="margin: 0;">Generate Playlists</a>
            <a href="/actions/cache" role="button" class="secondary" style="margin: 0;">Manage Cache</a>
            <a href="/config" role="button" class="outline" style="margin: 0;">Configuration</a>
          </div>
        </section>
      </div>
    </Layout>
  );
}
