import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

// 图标组件保持不变
const CircleIcon = () => <div className="w-4 h-4 rounded-full border-2 border-white/80"></div>;
const CheckIcon = () => <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const EditIcon = () => <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;

export const SubTaskCard = ({ task, index }: { task: any, index: number }) => {
    // 1. 判断当前卡片是在左列还是右列 (假设是两列布局)
    // 偶数索引 (0, 2, 4...) 在左边，奇数索引 (1, 3, 5...) 在右边
    const isLeftColumn = index % 2 === 0;

    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const isPending = task.status === 'pending';

    // 样式配置
    const getStyles = () => {
        if (isCompleted) return {
            bg: "bg-gradient-to-br from-[#135443] to-[#669ca0]",
            tab: "bg-[#1A423D]"
        };
        if (isInProgress) return {
            bg: "bg-gradient-to-br from-[#D98C85] to-[#C64D48]",
            tab: "bg-[#8A332E]"
        };
        if (isPending) return {
            bg: "bg-gradient-to-br from-[#7976C2] to-[#625EA8]",
            tab: "bg-[#3E3B6B]"
        };
        return {
            bg: "bg-gradient-to-br from-[#7FB0D6] to-[#5A8CB2]",
            tab: "bg-[#2C5270]"
        };
    };

    const styles = getStyles();

    return (
        // --- 核心改动 1: 占位符容器 ---
        // 这里的 h-[200px] 必须是固定的或者是 min-h，用来在 Grid 里占座。
        // relative 是为了给内部的 absolute 元素提供定位基准。
        // z-index: hover 时设为 50，保证展开时压在其他卡片上面。
        <div className="relative h-[200px] w-full group z-0 hover:z-50">

            {/* --- 核心改动 2: 绝对定位的卡片真身 --- */}
            <div
                className={clsx(
                    "absolute top-0 shadow-lg rounded-sm transition-all duration-300 ease-out flex flex-col",
                    styles.bg,
                    // 默认状态：宽度和高度填满占位符
                    "w-full h-full",
                    // 悬浮状态 (group-hover)：
                    // 1. h-auto: 高度解除限制，根据内容自动撑开
                    // 2. min-h-full: 保证至少和占位符一样高
                    // 3. 宽度: 计算为 200% + 2rem (gap-8 的宽度)
                    "group-hover:h-auto group-hover:min-h-full group-hover:w-[calc(200%+4rem)]",

                    // 核心逻辑：你是左边的卡片，就向右变宽；你是右边的，就向左变宽
                    isLeftColumn ? "left-0" : "right-0"
                )}
            >
                {/* 装饰性 Tab (随卡片移动) */}
                <div className={clsx("absolute -top-2 right-8 w-20 h-4 rounded-t-sm z-[-1]", styles.tab)}></div>
                <div className={clsx("absolute top-8 -left-2 w-4 h-30 rounded-l-sm z-[-1]", styles.tab)}></div>

                {/* 标题区 (永远显示) */}
                <div className="p-6 pb-2 flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white drop-shadow-md">
                            Sub-Task #{String(index + 1).padStart(3, '0')}
                        </h3>
                        <div className="opacity-90">{isCompleted ? <CheckIcon /> : <CircleIcon />}</div>
                    </div>
                    <h4 className="text-white/95 font-medium text-lg leading-snug mb-2 line-clamp-2">
                        {task.task_title || "Analyzing Data..."}
                    </h4>
                    <div className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-black/20 text-white/90">
                        {task.status.replace('_', ' ')}
                    </div>
                </div>

                {/* 展开内容区 (悬浮时显示) */}
                {/* 使用 opacity 和 max-height 做过渡，比 grid 方案在 absolute 下更稳定 */}
                <div className="px-6 pb-6 pt-2 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-[800px] group-hover:overflow-y-scroll transition-all duration-500 delay-75 overflow-hidden flex flex-col gap-4">

                    {/* Prompt Box */}
                    <div className="bg-[#EBEBEB] rounded p-3 shadow-inner relative mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase bg-slate-200 px-1.5 py-0.5 rounded">Prompt</span>
                            <div className="p-1 bg-slate-300 rounded-full"><EditIcon /></div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {task.prompt_content}
                        </p>
                    </div>

                    {/* Result Box */}
                    {task.result_content && (
                        <div className="bg-white rounded p-4 shadow-lg border-l-4 border-l-current text-slate-600">
                            <span className="text-xs font-bold opacity-70 uppercase mb-2 block">Result</span>
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{task.result_content}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};