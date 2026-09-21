import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import Alert from '../components/ui/Alert';
import NFCCard from '../components/cards/NFCCard';
import { cardService } from '../services/cardService';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function MyCard() {
  useDocumentTitle('My Card');
  const [card, setCard] = useState(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cardService
      .getMyCard()
      .then((r) => {
        setCard(r.card || null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load card information.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <PageContainer maxWidth="max-w-3xl">
        <PageHeader
          title="My NFC Card"
          description="Your official digital identity credential. Physical credentials contain encrypted, opaque tokens."
        />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {loading ? (
          <LoadingState text="Loading card credential..." />
        ) : card ? (
          <div className="space-y-6">
            {/* The Digital NFC Credential Component */}
            <div className="flex justify-center">
              <NFCCard card={card} />
            </div>

            {/* Safe Metadata Breakdown */}
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800">
                Card Security & Metadata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Hardware Label:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {card.cardLabel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Credential Status:</span>
                  <span className="font-semibold text-emerald-400">
                    {card.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Issue Date:</span>
                  <span className="text-slate-200">
                    {card.issuedAt
                      ? new Date(card.issuedAt).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })
                      : 'Initial Provision'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Security Standard:</span>
                  <span className="text-slate-200">
                    HMAC-SHA256 Derived Hash (Zero Raw Tokens)
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-400 leading-relaxed">
              <strong className="text-blue-300 block mb-1">Privacy Guarantee:</strong>
              This card does not store your name, email, or database ID. If you lose your physical card,
              an administrator can immediately revoke it and provision a replacement without losing your attendance history.
            </div>
          </div>
        ) : (
          <EmptyState
            title="No NFC Card Assigned"
            description="You do not currently have a physical NFC card assigned to your account. Please ask an authorized event administrator to provision a card for you."
          />
        )}
      </PageContainer>
    </div>
  );
}
