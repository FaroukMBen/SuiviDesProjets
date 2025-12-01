'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';

interface Criterion {
  name: string;
  weight: number;
  maxScore: number;
  score?: number;
}

interface Evaluation {
  _id: string;
  evaluator: any;
  criteria: Criterion[];
  totalScore: number;
  feedback: string;
  status: string;
}

export function EvaluationGrid({ projectId, userRole }: { projectId: string; userRole?: string }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    criteria: [{ name: '', weight: 1, maxScore: 10, score: 0 }],
    feedback: ''
  });

  useEffect(() => {
    fetchEvaluations();
  }, [projectId]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/evaluations/project/${projectId}`);
      setEvaluations(response.data.evaluations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaChange = (index: number, field: string, value: any) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: '', weight: 1, maxScore: 10, score: 0 }]
    });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index)
    });
  };

  const submitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/evaluations', {
        projectId,
        ...formData
      });
      setEvaluations([...evaluations, response.data.evaluation]);
      setShowForm(false);
      setFormData({
        criteria: [{ name: '', weight: 1, maxScore: 10, score: 0 }],
        feedback: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create evaluation');
    }
  };

  const calculateAverageScore = () => {
    if (evaluations.length === 0) return 0;
    return (evaluations.reduce((sum, e) => sum + e.totalScore, 0) / evaluations.length).toFixed(2);
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[--color-border]">
          <p className="text-sm text-[--color-muted] mb-1">Total Evaluations</p>
          <p className="text-2xl font-bold text-[--color-foreground]">{evaluations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[--color-border]">
          <p className="text-sm text-[--color-muted] mb-1">Average Score</p>
          <p className="text-2xl font-bold text-[--color-foreground]">{calculateAverageScore()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[--color-border]">
          <p className="text-sm text-[--color-muted] mb-1">Status</p>
          <p className="text-2xl font-bold text-[--color-foreground]">
            {evaluations.filter(e => e.status === 'completed').length}/{evaluations.length}
          </p>
        </div>
      </div>

      {(userRole === 'instructor' || userRole === 'admin') && (
        <div className="bg-white p-6 rounded-lg border border-[--color-border]">
          {showForm ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const submitEvaluation = async () => {
                try {
                  const response = await api.post('/api/evaluations', {
                    projectId,
                    ...formData
                  });
                  setEvaluations([...evaluations, response.data.evaluation]);
                  setShowForm(false);
                  setFormData({
                    criteria: [{ name: '', weight: 1, maxScore: 10, score: 0 }],
                    feedback: ''
                  });
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Failed to create evaluation');
                }
              };
              submitEvaluation();
            }} className="space-y-4">
              <h3 className="text-lg font-semibold text-[--color-foreground]">Create Evaluation</h3>

              <div className="space-y-3">
                {formData.criteria.map((criterion, idx) => (
                  <div key={idx} className="p-4 bg-[--color-surface] rounded-lg border border-[--color-border] space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Criterion name"
                        value={criterion.name}
                        onChange={(e) => handleCriteriaChange(idx, 'name', e.target.value)}
                        className="px-3 py-2 border border-[--color-border] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                      />
                      <input
                        type="number"
                        placeholder="Weight"
                        value={criterion.weight}
                        onChange={(e) => handleCriteriaChange(idx, 'weight', parseFloat(e.target.value))}
                        className="px-3 py-2 border border-[--color-border] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                      />
                      <input
                        type="number"
                        placeholder="Max score"
                        value={criterion.maxScore}
                        onChange={(e) => handleCriteriaChange(idx, 'maxScore', parseInt(e.target.value))}
                        className="px-3 py-2 border border-[--color-border] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                      />
                      <input
                        type="number"
                        placeholder="Score"
                        value={criterion.score}
                        onChange={(e) => handleCriteriaChange(idx, 'score', parseInt(e.target.value))}
                        className="px-3 py-2 border border-[--color-border] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                      />
                    </div>
                    {formData.criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="text-sm text-[--color-error] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addCriterion}
                className="text-sm text-[--color-primary] hover:underline font-medium"
              >
                + Add criterion
              </button>

              <div>
                <label className="block text-sm font-medium text-[--color-foreground] mb-2">
                  Feedback
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-[--color-border] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                  placeholder="Provide feedback..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[--color-primary] text-white rounded font-medium hover:bg-blue-600 transition"
                >
                  Submit Evaluation
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-[--color-border] text-[--color-foreground] rounded font-medium hover:bg-[--color-surface]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[--color-primary] text-white rounded font-medium hover:bg-blue-600 transition"
            >
              Create Evaluation
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {evaluations.map((evaluation) => (
          <div key={evaluation._id} className="bg-white p-6 rounded-lg border border-[--color-border]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold text-[--color-foreground]">
                  Evaluator: {evaluation.evaluator?.name}
                </p>
                <p className="text-sm text-[--color-muted]">{evaluation.evaluator?.email}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[--color-primary]">{evaluation.totalScore}</p>
                <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                  evaluation.status === 'completed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {evaluation.status}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-[--color-foreground] mb-2">Criteria</h4>
              <div className="space-y-2">
                {evaluation.criteria.map((criterion, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-[--color-foreground]">{criterion.name}</p>
                      <p className="text-xs text-[--color-muted]">Weight: {criterion.weight}x</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[--color-foreground]">
                        {criterion.score}/{criterion.maxScore}
                      </p>
                      <div className="w-24 h-2 bg-[--color-surface] rounded-full mt-1">
                        <div
                          className="h-full bg-[--color-primary] rounded-full"
                          style={{
                            width: `${(((criterion.score || 0) / criterion.maxScore) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {evaluation.feedback && (
              <div className="bg-[--color-surface] p-4 rounded-lg">
                <p className="text-sm font-medium text-[--color-foreground] mb-2">Feedback</p>
                <p className="text-sm text-[--color-muted]">{evaluation.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {evaluations.length === 0 && !showForm && (
        <div className="bg-white p-8 rounded-lg border border-[--color-border] text-center">
          <p className="text-[--color-muted]">No evaluations yet</p>
        </div>
      )}
    </div>
  );
}
