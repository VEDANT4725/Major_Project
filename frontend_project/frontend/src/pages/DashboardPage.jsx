import { CreateProjectDialog, EmptyState, ProjectGrid } from "@/components/dashboard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api-client";
import { useAuth } from "@/components/auth";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function DashboardPage() {
  const {
    getToken
  } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectFiles, setProjectFiles] = useState({});
  const fetchProjects = useCallback(async () => {
    try {
      const client = createApiClient(getToken);
      const data = await client.projects.list();
      setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ID of the project being renamed (null = dialog closed)
  const [renameTarget, setRenameTarget] = useState(null);

  // Current value of the rename input
  const [renameValue, setRenameValue] = useState("");

  // Ref for auto-focusing the rename input
  const renameInputRef = useRef(null);
  function handleRename(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    setRenameValue(project.name);
    setRenameTarget(id);

    // Auto-focus after the dialog renders
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 50);
  }
  async function confirmRename() {
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    const original = projects.find(p => p.id === renameTarget);
    if (!trimmed || trimmed === original?.name) {
      setRenameTarget(null);
      return;
    }

    // Optimistic update
    setProjects(prev => prev.map(p => p.id === renameTarget ? {
      ...p,
      name: trimmed
    } : p));
    setRenameTarget(null);
    try {
      const client = createApiClient(getToken);
      await client.projects.update(renameTarget, {
        name: trimmed
      });
      toast.success("Project renamed");
    } catch {
      // Revert on failure
      setProjects(prev => prev.map(p => p.id === renameTarget ? {
        ...p,
        name: original?.name ?? p.name
      } : p));
      toast.error("Failed to rename project");
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const client = createApiClient(getToken);
      await client.projects.delete(deleteTarget);
      setProjects(previous => previous.filter(project => project.id !== deleteTarget));

      // Clean up files state
      setProjectFiles(prev => {
        const next = {
          ...prev
        };
        delete next[deleteTarget];
        return next;
      });
      toast.success("Project deleted.");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Try again.");
    } finally {
      setDeleteTarget(null);
    }
  }
  useEffect(() => {
    if (projects.length === 0) return;
    let mounted = true;
    const client = createApiClient(getToken);
    projects.forEach(project => {
      // Skip if already fetched
      if (projectFiles[project.id] !== undefined) return;
      client.projects.getFiles(project.id).then(data => {
        if (!mounted) return;

        // Convert ProjectFile[] to Record<string, string>
        const fileRecord = {};
        for (const file of data.files) {
          fileRecord[file.path] = file.content;
        }
        setProjectFiles(prev => ({
          ...prev,
          [project.id]: fileRecord
        }));
      }).catch(() => {
        if (!mounted) return;

        // On error, set empty object so it shows the fallback gradient
        setProjectFiles(prev => ({
          ...prev,
          [project.id]: {}
        }));
      });
    });
  }, [projects, projectFiles, getToken]);
  const handleCreateProject = async data => {
    try {
      const client = createApiClient(getToken);
      const response = await client.projects.create(data);
      try {
        sessionStorage.setItem(`pending_prompt_${response.project.id}`, data.description.trim());
      } catch {}
      navigate(`/project/${response.project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      const message = error instanceof Error ? error.message : "Failed to create project";
      toast.error(message);
    }
  };
  function handleDelete(id) {
    setDeleteTarget(id);
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "flex flex-col gap-6 p-6",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsx("h1", {
        className: "text-2xl font-bold",
        children: "My Projects"
      }), /*#__PURE__*/_jsxs(Button, {
        onClick: () => setDialogOpen(true),
        className: "gap-2",
        children: [/*#__PURE__*/_jsx(Plus, {
          className: "size-4"
        }), "Create Project"]
      })]
    }), loading ? /*#__PURE__*/_jsx("div", {
      className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      children: Array.from({
        length: 4
      }).map((_, index) => /*#__PURE__*/_jsx(Skeleton, {
        className: "h-[240px] rounded-xl"
      }, index))
    }) : projects.length > 0 ? /*#__PURE__*/_jsx(ProjectGrid, {
      projects: projects,
      projectFiles: projectFiles,
      onNewProject: () => setDialogOpen(true),
      onRename: handleRename,
      onDelete: handleDelete
    }) : /*#__PURE__*/_jsx(EmptyState, {
      onCreateProject: () => setDialogOpen(true)
    }), /*#__PURE__*/_jsx(CreateProjectDialog, {
      open: dialogOpen,
      onOpenChange: setDialogOpen,
      onSubmit: handleCreateProject
    }), /*#__PURE__*/_jsx(Dialog, {
      open: renameTarget !== null,
      onOpenChange: open => {
        if (!open) setRenameTarget(null);
      },
      children: /*#__PURE__*/_jsxs(DialogContent, {
        className: "sm:max-w-[400px]",
        children: [/*#__PURE__*/_jsxs(DialogHeader, {
          children: [/*#__PURE__*/_jsx(DialogTitle, {
            children: "Rename project"
          }), /*#__PURE__*/_jsx(DialogDescription, {
            children: "Enter a new name for your project."
          })]
        }), /*#__PURE__*/_jsx(Input, {
          ref: renameInputRef,
          value: renameValue,
          onChange: event => setRenameValue(event.target.value),
          onKeyDown: event => {
            if (event.key === "Enter") {
              event.preventDefault();
              confirmRename();
            }
            if (event.key === "Escape") {
              setRenameTarget(null);
            }
          },
          placeholder: "Project name",
          maxLength: 100
        }), /*#__PURE__*/_jsxs(DialogFooter, {
          children: [/*#__PURE__*/_jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => setRenameTarget(null),
            children: "Cancel"
          }), /*#__PURE__*/_jsx(Button, {
            size: "sm",
            onClick: confirmRename,
            disabled: !renameValue.trim() || renameValue.trim() === projects.find(p => p.id === renameTarget)?.name,
            children: "Rename"
          })]
        })]
      })
    }), /*#__PURE__*/_jsx(AlertDialog, {
      open: deleteTarget !== null,
      onOpenChange: open => {
        if (!open) setDeleteTarget(null);
      },
      children: /*#__PURE__*/_jsxs(AlertDialogContent, {
        children: [/*#__PURE__*/_jsxs(AlertDialogHeader, {
          children: [/*#__PURE__*/_jsx(AlertDialogTitle, {
            children: "Delete project?"
          }), /*#__PURE__*/_jsx(AlertDialogDescription, {
            children: "This will permanently delete the project and all its versions. This action cannot be undone."
          })]
        }), /*#__PURE__*/_jsxs(AlertDialogFooter, {
          children: [/*#__PURE__*/_jsx(AlertDialogCancel, {
            children: "Cancel"
          }), /*#__PURE__*/_jsx(AlertDialogAction, {
            variant: "destructive",
            onClick: confirmDelete,
            children: "Delete"
          })]
        })]
      })
    })]
  });
}
