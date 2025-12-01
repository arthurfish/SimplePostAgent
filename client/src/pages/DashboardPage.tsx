// src/pages/DashboardPage.tsx
import { Layout } from "../components/ui/Layout";
import { NewRequestForm } from "../components/requests/NewRequestForm";
import { RequestList } from "../components/requests/RequestList";

export const DashboardPage = () => {
    return (
        <Layout>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <NewRequestForm />
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Your Requests</h2>
                    <RequestList />
                </div>
            </div>
        </Layout>
    );
};