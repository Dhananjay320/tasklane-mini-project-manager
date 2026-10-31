import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Project, Task, TaskSort, TaskStatus, User } from "@/lib/types";

// Same-origin: /api is proxied to Express by next.config.ts, and the httpOnly auth cookie rides along.
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "same-origin" }),
  tagTypes: ["Me", "Project", "Task"],
  endpoints: (build) => ({
    // ---- auth ----
    me: build.query<{ user: User }, void>({ query: () => "/auth/me", providesTags: ["Me"] }),
    signup: build.mutation<{ user: User }, { name: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
    }),
    login: build.mutation<{ user: User }, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: build.mutation<void, void>({ query: () => ({ url: "/auth/logout", method: "POST" }) }),

    // ---- projects ----
    listProjects: build.query<{ projects: Project[] }, { q?: string } | void>({
      query: (args) => ({ url: "/projects", params: args?.q ? { q: args.q } : undefined }),
      providesTags: (res) => [
        { type: "Project", id: "LIST" },
        ...(res?.projects.map((p) => ({ type: "Project" as const, id: p.id })) ?? []),
      ],
    }),
    getProject: build.query<{ project: Project }, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Project", id }],
    }),
    createProject: build.mutation<{ project: Project }, { title: string; description?: string }>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
    updateProject: build.mutation<{ project: Project }, { id: string; title?: string; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "Project", id }, { type: "Project", id: "LIST" }],
    }),
    deleteProject: build.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: (_res, _err, id) => [{ type: "Project", id }, { type: "Project", id: "LIST" }],
    }),

    // ---- tasks ----
    listTasks: build.query<{ tasks: Task[] }, { projectId: string; status?: TaskStatus; sort: TaskSort }>({
      query: ({ projectId, status, sort }) => ({
        url: `/projects/${projectId}/tasks`,
        params: { sort, ...(status ? { status } : {}) },
      }),
      providesTags: (_res, _err, { projectId }) => [{ type: "Task", id: `LIST-${projectId}` }],
    }),
    createTask: build.mutation<{ task: Task }, { projectId: string; body: TaskInput }>({
      query: ({ projectId, body }) => ({ url: `/projects/${projectId}/tasks`, method: "POST", body }),
      invalidatesTags: (_res, _err, { projectId }) => taskChangeTags(projectId),
    }),
    updateTask: build.mutation<{ task: Task }, { id: string; projectId: string; body: Partial<TaskInput> }>({
      query: ({ id, body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, { projectId }) => taskChangeTags(projectId),
    }),
    deleteTask: build.mutation<void, { id: string; projectId: string }>({
      query: ({ id }) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: (_res, _err, { projectId }) => taskChangeTags(projectId),
    }),
  }),
});

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  /** "YYYY-MM-DD", or null for no due date. */
  dueDate: string | null;
}

// A task change also changes the project's counts and its "updated" time on the dashboard.
const taskChangeTags = (projectId: string) => [
  { type: "Task" as const, id: `LIST-${projectId}` },
  { type: "Project" as const, id: projectId },
  { type: "Project" as const, id: "LIST" },
];

export const {
  useMeQuery,
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = api;
