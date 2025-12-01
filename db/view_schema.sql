create or replace view sub_tasks_with_userid as
select request_id, task_title, prompt_content, result_content, r.status as status, r.created_at as created_at, r.updated_at as updated_at, user_id
from sub_tasks s inner join requests r on s.request_id = r.id
