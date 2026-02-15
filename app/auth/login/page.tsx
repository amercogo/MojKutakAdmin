
import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
    title: 'Login - Moj Kutak Admin',
    description: 'Prijavite se na Moj Kutak admin panel.',
};

export default function LoginPage() {
    return <LoginForm />;
}
