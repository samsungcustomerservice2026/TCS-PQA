import { redirect } from 'next/navigation';

export default function ExternalLoggingRedirectPage() {
  redirect('/?portal=admin&logs=external');
}
