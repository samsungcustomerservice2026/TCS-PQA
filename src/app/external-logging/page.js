import { redirect } from 'next/navigation';

export default function ExternalLoggingRedirectPage() {
  redirect('/?logs=external');
}
