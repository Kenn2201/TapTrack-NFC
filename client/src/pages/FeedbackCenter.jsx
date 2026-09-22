import React, { useState } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Section from '../components/ui/Section';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useAuth } from '../hooks/useAuth';
import { feedbackService } from '../services/feedbackService';
import useDocumentTitle from '../hooks/useDocumentTitle';

const CATEGORIES = [
  { value: 'BUG', label: 'Bug Report', icon: '🐛' },
  { value: 'UX', label: 'UX', icon: '🎨' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: '💡' },
  { value: 'NFC_ATTENDANCE', label: 'NFC / Attendance', icon: '📱' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

export default function FeedbackCenter() {
  useDocumentTitle('Feedback Center');
  const { user } = useAuth();

  const [category, setCategory] = useState('FEATURE');
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(window.location.pathname);
  const [reproduction, setReproduction] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageToast, setMessageToast] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide your feedback message.');
      return;
    }
    setLoading(true);
    setMessageToast(null);
    setError(null);

    try {
      await feedbackService.submit({
        category,
        rating,
        message: message.trim(),
        page,
        reproduction: reproduction.trim() || null,
      });
      setCategory('FEATURE');
      setRating(3);
      setMessage('');
      setReproduction('');
      setMessageToast('Thank you! Your feedback has been submitted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-3xl">
        <PageHeader
          title="Feedback Center"
          description="Share your experience, report bugs, or suggest new features. Your input helps improve TapTrack NFC."
        />

        {messageToast && (
          <div className="mb-6">
            <Alert type="success" message={messageToast} onClose={() => setMessageToast(null)} />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <Section title="Submit Feedback" subtitle="All fields are optional except the message">
          <Card className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all min-h-[44px] ${
                        category === cat.value
                          ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                          : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Rating <span className="text-slate-500">({rating}/5)</span>
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 transition-transform hover:scale-110 ${
                        star <= rating ? 'text-amber-400' : 'text-slate-600 hover:text-amber-300'
                      }`}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <svg className="w-8 h-8" fill={star <= rating ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Your Feedback"
                required
                multiline
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your experience, the bug you found, or the feature you'd like to see..."
                helperText="Be as specific as possible. Include steps to reproduce if reporting a bug."
              />

              <Input
                label="Page / Context (auto-filled)"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                helperText="The page where you're submitting from. Helps us understand context."
              />

              <Input
                label="Steps to Reproduce (for bugs)"
                multiline
                rows={4}
                value={reproduction}
                onChange={(e) => setReproduction(e.target.value)}
                placeholder="1. Go to... 2. Click... 3. See error..."
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" loading={loading} disabled={loading || !message.trim()}>
                  Submit Feedback
                </Button>
              </div>
            </form>
          </Card>
        </Section>

        <Section title="What happens next?" subtitle="Your feedback workflow">
          <Card className="p-5 space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold text-sm">1</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Submitted</h4>
                <p className="text-xs text-slate-400">Your feedback is logged with category, rating, and context.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Triaged</h4>
                <p className="text-xs text-slate-400">Admins review, categorize, and prioritize feedback submissions.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-bold text-sm">3</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Actioned</h4>
                <p className="text-xs text-slate-400">Bugs are fixed, features are planned, improvements are scheduled.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-400/20 flex items-center justify-center text-purple-400 font-bold text-sm">4</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Released</h4>
                <p className="text-xs text-slate-400">Changes ship in the next appropriate release. Check the changelog!</p>
              </div>
            </div>
          </Card>
        </Section>
      </PageContainer>
    </div>
  );
}