import { redirect } from 'next/navigation';

export default function FeedbackRedirectPage() {
  redirect('/?feedback=1');
}
