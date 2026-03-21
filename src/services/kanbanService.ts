import apiClient from "../lib/apiClient";
import type {
  KanbanBoard,
  KanbanTask,
  CreateKanbanTaskPayload,
  UpdateKanbanTaskPayload,
  MoveKanbanTaskPayload,
} from "../types/api";

const BOARDS_BASE = "/api/kanban/boards";
const TASKS_BASE = "/api/kanban/tasks";

export const kanbanService = {
  /**
   * Fetch all kanban boards.
   */
  async getBoards(): Promise<KanbanBoard[]> {
    return apiClient.get<KanbanBoard[]>(BOARDS_BASE);
  },

  /**
   * Fetch tasks, optionally filtered by board ID.
   */
  async getTasks(boardId?: number): Promise<KanbanTask[]> {
    return apiClient.get<KanbanTask[]>(TASKS_BASE, { boardId });
  },

  /**
   * Create a new kanban task.
   */
  async createTask(data: CreateKanbanTaskPayload): Promise<KanbanTask> {
    return apiClient.post<KanbanTask>(TASKS_BASE, data);
  },

  /**
   * Update an existing kanban task.
   */
  async updateTask(id: number, data: UpdateKanbanTaskPayload): Promise<KanbanTask> {
    return apiClient.put<KanbanTask>(`${TASKS_BASE}/${id}`, data);
  },

  /**
   * Move a task to a different column.
   */
  async moveTask(id: number, colonneId: number, ordre?: number): Promise<KanbanTask> {
    const payload: MoveKanbanTaskPayload = { colonneId, ordre };
    return apiClient.put<KanbanTask>(`${TASKS_BASE}/${id}/move`, payload);
  },

  /**
   * Delete a kanban task by ID.
   */
  async deleteTask(id: number): Promise<void> {
    return apiClient.delete<void>(`${TASKS_BASE}/${id}`);
  },
};

export default kanbanService;
