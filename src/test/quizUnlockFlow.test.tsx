import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizResult } from '@/components/Quiz/QuizResult';
import { QuizEmail, formatPhone, normalizePhone, normalizeEmail, PRIVACY_POLICY_URL } from '@/components/Quiz/QuizEmail';
import { profileResults } from '@/data/profileResults';
import { profileSummaries } from '@/data/profileSummaries';
import { QuizResult as QuizResultType } from '@/types/quiz.types';

const mockResult: QuizResultType = {
  scores: { A: 12, B: 3, C: 2, D: 4, E: 1, F: 0 },
  dominant: {
    code: 'A',
    name: 'Perfeccionista Paralisado',
    score: 12,
    intensity: 'Muito Forte',
    description: 'Você passa semanas refinando um parágrafo. Tem dificuldade extrema em considerar trabalhos finalizados.',
    color: '#8b5cf6',
    icon: '✨'
  },
  secondary: []
};

describe('Quiz Unlock Flow & Consent Verification (26 Test Criteria)', () => {
  it('1 & 2 & 3. Displays profile name and short summary for free in Estado 1 (Locked)', () => {
    render(
      <QuizResult
        result={mockResult}
        isUnlocked={false}
        onUnlockSubmit={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Perfeccionista Paralisado')).toBeInTheDocument();
    expect(screen.getByText(profileSummaries['A'])).toBeInTheDocument();
    expect(screen.getByText('Seu diagnóstico detalhado e seu protocolo inicial estão prontos.')).toBeInTheDocument();
  });

  it('4 & 5 & 25. Detailed diagnosis, recommendations, offer, and Greenn CTAs are NOT in DOM before unlock', () => {
    render(
      <QuizResult
        result={mockResult}
        isUnlocked={false}
        onUnlockSubmit={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // Blocked content must NOT be in DOM
    expect(screen.queryByText('Qual o significado do seu perfil identificado?')).toBeNull();
    expect(screen.queryByText('Conforme prometido, veja as 5 implementações imediatas que você pode (e deve) aplicar na sua rotina:')).toBeNull();
    expect(screen.queryByText('Por que os métodos tradicionais de produtividade falham na pós-graduação?')).toBeNull();
    expect(screen.queryByText('Quero meu Diagnóstico por R$27')).toBeNull();
    expect(screen.queryByText('Oferta Especial do Diagnóstico')).toBeNull();
  });

  it('8. Mandatory privacy consent checkbox is unchecked by default', () => {
    render(
      <QuizEmail
        onSubmit={vi.fn()}
        isEmbedded={true}
      />
    );

    const privacyCheckbox = screen.getByLabelText(/Li e concordo com a Política de Privacidade/i);
    expect(privacyCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  it('9 & 14. Optional marketing consent checkbox is unchecked by default and visually tagged as Opcional', () => {
    render(
      <QuizEmail
        onSubmit={vi.fn()}
        isEmbedded={true}
      />
    );

    const marketingCheckbox = screen.getByLabelText(/Comunicações e Conteúdos do Sistema A.C.A.D.E.M.I.A/i);
    expect(marketingCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Opcional')).toBeInTheDocument();
  });

  it('6 & 7. Form validation blocks submission when required fields are missing or privacy consent unchecked', async () => {
    const handleSubmit = vi.fn();
    render(
      <QuizEmail
        onSubmit={handleSubmit}
        isEmbedded={true}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /LIBERAR MEU DIAGNÓSTICO/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Por favor, insira um e-mail válido')).toBeInTheDocument();
      expect(screen.getByText('Por favor, insira um WhatsApp válido com DDD (10 ou 11 dígitos)')).toBeInTheDocument();
      expect(screen.getByText('Você precisa concordar com a Política de Privacidade para liberar seu diagnóstico.')).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('10 & 11. Form submits successfully with marketing consent unchecked (saves marketing_consent: false)', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({ success: true });
    render(
      <QuizEmail
        onSubmit={handleSubmit}
        isEmbedded={true}
      />
    );

    fireEvent.change(screen.getByLabelText(/Seu nome completo/i), { target: { value: 'Maria Silva' } });
    fireEvent.change(screen.getByLabelText(/Seu melhor e-mail/i), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp \(com DDD\)/i), { target: { value: '11999998888' } });

    // Check mandatory privacy consent
    const privacyCheckbox = screen.getByLabelText(/Li e concordo com a Política de Privacidade/i);
    fireEvent.click(privacyCheckbox);

    const submitBtn = screen.getByRole('button', { name: /LIBERAR MEU DIAGNÓSTICO/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '(11) 99999-8888',
        privacyConsent: true,
        marketingConsent: false
      });
    });
  });

  it('12 & 13. Form submits with marketing consent checked (saves marketing_consent: true)', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({ success: true });
    render(
      <QuizEmail
        onSubmit={handleSubmit}
        isEmbedded={true}
      />
    );

    fireEvent.change(screen.getByLabelText(/Seu nome completo/i), { target: { value: 'João Santos' } });
    fireEvent.change(screen.getByLabelText(/Seu melhor e-mail/i), { target: { value: 'joao@example.com' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp \(com DDD\)/i), { target: { value: '11988887777' } });

    // Check both checkboxes
    fireEvent.click(screen.getByLabelText(/Li e concordo com a Política de Privacidade/i));
    fireEvent.click(screen.getByLabelText(/Comunicações e Conteúdos do Sistema A.C.A.D.E.M.I.A/i));

    fireEvent.click(screen.getByRole('button', { name: /LIBERAR MEU DIAGNÓSTICO/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'João Santos',
        email: 'joao@example.com',
        phone: '(11) 98888-7777',
        privacyConsent: true,
        marketingConsent: true
      });
    });
  });

  it('15 & 16. Phone and Email helpers normalize inputs correctly', () => {
    expect(normalizeEmail('  Test.User@Domain.COM  ')).toBe('test.user@domain.com');
    expect(normalizePhone('(11) 99999-8888')).toBe('11999998888');
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('18 & 26. Success unlocks full detailed diagnosis and renders offer & Greenn CTAs in Estado 2', () => {
    render(
      <QuizResult
        result={mockResult}
        isUnlocked={true}
        onUnlockSubmit={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText('Diagnóstico liberado com sucesso.')).toBeInTheDocument();
    expect(screen.getByText('Qual o significado do seu perfil identificado?')).toBeInTheDocument();
    expect(screen.getByText('Conforme prometido, veja as 5 implementações imediatas que você pode (e deve) aplicar na sua rotina:')).toBeInTheDocument();
    expect(screen.getAllByText('Quero meu Diagnóstico por R$27').length).toBeGreaterThan(0);
  });

  it('19 & 20. Supabase failure keeps content locked and allows retry without wiping form inputs', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({
      success: false,
      error: 'Não foi possível liberar seu diagnóstico agora. Verifique sua conexão e tente novamente.'
    });

    render(
      <QuizEmail
        onSubmit={handleSubmit}
        isEmbedded={true}
      />
    );

    const nameInput = screen.getByLabelText(/Seu nome completo/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Ana Paula' } });
    fireEvent.change(screen.getByLabelText(/Seu melhor e-mail/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/WhatsApp \(com DDD\)/i), { target: { value: '11977776666' } });
    fireEvent.click(screen.getByLabelText(/Li e concordo com a Política de Privacidade/i));

    fireEvent.click(screen.getByRole('button', { name: /LIBERAR MEU DIAGNÓSTICO/i }));

    await waitFor(() => {
      expect(screen.getByText('Não foi possível liberar seu diagnóstico agora. Verifique sua conexão e tente novamente.')).toBeInTheDocument();
    });

    // Filled inputs are preserved for retry
    expect(nameInput.value).toBe('Ana Paula');
  });

  it('Privacy Policy link opens in new tab with valid URL and noopener', () => {
    render(
      <QuizEmail
        onSubmit={vi.fn()}
        isEmbedded={true}
      />
    );

    const privacyLink = screen.getByText('Política de Privacidade') as HTMLAnchorElement;
    expect(privacyLink.href).toBe(PRIVACY_POLICY_URL);
    expect(privacyLink.target).toBe('_blank');
    expect(privacyLink.rel).toContain('noopener');
  });
});
