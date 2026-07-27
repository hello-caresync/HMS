import { redirect } from 'next/navigation';

export default function LegacyDocumentsRedirect() {
  redirect('/doctor/clinical-documents');
}
