// src/pages/RequestDetailsPage.tsx
import { useParams } from "react-router-dom";
import { Layout } from "../components/ui/Layout";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SubTaskList } from "../components/requests/SubTaskList";
import {Spinner} from "../components/ui/Spinner.tsx";
import {useLiveRequests} from "../hooks/useLiveQueries.ts";

export const RequestDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { data: requests, isLoading } = useLiveRequests();

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" />
                </div>
            </Layout>
        );
    }

    const request = requests.find((r) => r.id === id);

    if (!request) {
        return (
            <Layout>
                <Card>
                    <h1 className="text-xl font-bold">Request Not Found</h1>
                    <p>The request with ID "{id}" could not be found.</p>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <Card>
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold mb-2">Request Details</h1>
                        <StatusBadge status={request.status} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Input:</span> {request.user_input}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        ID: {request.id}
                    </p>
                </Card>

                {/* 子任务列表 */}
                <SubTaskList requestId={request.id} />

                {/* 最终报告 */}
                {request.status === 'completed' && request.final_report && (
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Final Report</h2>
                        {/* 简单地使用 <pre> 标签渲染报告，后续可替换为 Markdown 渲染器 */}
                        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
              {request.final_report}
            </pre>
                    </Card>
                )}
            </div>
        </Layout>
    );
};