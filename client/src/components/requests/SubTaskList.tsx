import { useLiveSubTasks } from "../../hooks/useLiveQueries";
import { SubTaskCard } from "./SubTaskCard";
import { Spinner } from "../ui/Spinner";

export const SubTaskList = ({ requestId }: { requestId: string }) => {
    const { data: subTasks, isLoading } = useLiveSubTasks(requestId);

    if (isLoading) return <div className="py-10"><Spinner /></div>;

    if (!subTasks || subTasks.length === 0) {
        return <div className="text-gray-500 italic ml-1">No sub-tasks generated yet...</div>;
    }

    // 使用 Grid 布局，两列，间距 gap-8 (2rem)
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {subTasks.map((task, index) => (
                <SubTaskCard key={task.id} task={task} index={index} />
            ))}
        </div>
    );
};