import { redirect } from 'next/navigation';
import { ADMIN_PATHS } from '@/constants/paths';

export default function Page() {
  redirect(ADMIN_PATHS.RENTIFY.OVERVIEW);
}