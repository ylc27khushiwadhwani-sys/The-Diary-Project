import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';
import { getLetterStyle } from '../../utils/letterStyle';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({user: null}) }));

describe('garden letter composer', () => {
  it('shows a live full letter beside the fields without changing tabs', () => {
    render(<NoteEditor note={null} shelves={[]} onSave={vi.fn()} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('To'), {target:{value:'Tomorrow'}});
    fireEvent.change(screen.getByLabelText('Your message'), {target:{value:'Every word stays with me.\nEven the second line.'}});
    fireEvent.change(screen.getByLabelText('From'), {target:{value:'Quiet Q'}});
    const preview = screen.getByLabelText('Full letter preview');
    expect(within(preview).getByText('To: Tomorrow')).toBeInTheDocument();
    expect(within(preview).getByText(/Every word stays with me/)).toHaveTextContent('Even the second line.');
    expect(within(preview).getByText('- Quiet Q')).toBeInTheDocument();
    expect(screen.getByLabelText('Your message')).toBeVisible();
    fireEvent.click(screen.getByLabelText('Reenie Beanie'));
    expect(preview.style.fontFamily).toContain('Reenie Beanie');
    expect(screen.getByRole('tab', {name:/Write/})).toHaveAttribute('aria-selected','true');
  });
  it('keeps long existing content through preview and save with selected presentation', async () => {
    const long = 'A letter with room for every word. '.repeat(30);
    const save = vi.fn().mockResolvedValue(undefined);
    render(<NoteEditor note={{id:'existing', content:long, title:'For tomorrow', tags:['hope'], is_public:false}} shelves={[]} onSave={save} onClose={() => {}} />);
    expect(screen.getByLabelText('Your message')).toHaveValue(long);
    expect(screen.getByLabelText('Your message')).not.toHaveAttribute('maxlength');
    fireEvent.change(screen.getByLabelText('From'), {target:{value:'Quiet Q'}});
    fireEvent.click(screen.getByLabelText('Reenie Beanie'));
    fireEvent.click(screen.getByLabelText('Flower bouquet 4'));
    fireEvent.click(screen.getByRole('tab', {name:/Preview/}));
    expect(screen.getByText(/Preview of your envelope/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', {name:/Write/}));
    expect(screen.getByLabelText('Your message')).toHaveValue(long);
    fireEvent.click(screen.getByText('Save letter privately'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const saved = save.mock.calls[0][0];
    expect(saved.content).toBe(long);
    expect(saved.is_public).toBe(false);
    expect(saved.tags).toContain('hope');
    expect(getLetterStyle(saved.tags)).toEqual({font:2, flowers:3, from:'Quiet Q'});
  });
});
