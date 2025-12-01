// src/components/requests/SubTaskList.tsx
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { StatusBadge } from "../ui/StatusBadge";
import {useLiveSubTasks} from "../../hooks/useLiveQueries.ts";

interface SubTaskListProps {
    requestId: string;
}

export const SubTaskList = ({ requestId }: SubTaskListProps) => {
    // 使用专为子任务设计的 Hook
    const { data: subTasks, isLoading } = useLiveSubTasks(requestId);

    return (
        <Card>
            <h2 className="text-xl font-semibold mb-4">Sub-Tasks</h2>
            {isLoading ? (
                <div className="flex justify-center p-4">
                    <Spinner />
                </div>
            ) : subTasks.length === 0 ? (
                <p className="text-gray-500">Waiting for planner to generate sub-tasks...</p>
            ) : (
                <div className="space-y-4">
                    {subTasks.map((task) => (
                        <Card key={task.id} className="bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">{task.task_title}</h3>
                                <StatusBadge status={task.status} />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <p><span className="font-medium">Prompt:</span> {task.prompt_content}</p>
                                {task.status === 'completed' && task.result_content && (
                                    <p className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                        <span className="font-medium">Result:</span> {task.result_content}
                                    </p>
                                )}
                                {task.status === 'failed' && task.result_content && (
                                    <p className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 text-red-500">
                                        <span className="font-medium">Error:</span> {task.result_content.replace('ERROR: ', '')}
                                    </p>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Card>
    );
};