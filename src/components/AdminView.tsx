import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Check,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Zap,
  Clock,
  Edit,
  Trash2,
  X,
  Sun,
} from "lucide-react";
import type { Project, ProjectStatus, RiskLevel, AdminProjectForm, Language } from "../types";
import { translations } from "../translations";
import { useToast } from "./Toast";

interface AdminViewProps {
  projects: Project[];
  lang: Language;
  onCreateProject: (form: AdminProjectForm) => void;
  onUpdateStatus: (id: string, status: ProjectStatus) => void;
}

const statusColors: Record<string, string> = {
  Created: "bg-slate-500/20 text-slate-300",
  Funding: "bg-emerald-500/20 text-emerald-300",
  Active: "bg-blue-500/20 text-blue-300",
  Repaid: "bg-green-500/20 text-green-300",
  Defaulted: "bg-red-500/20 text-red-300",
};

const nextStatus: Record<ProjectStatus, ProjectStatus | null> = {
  Created: "Funding",
  Funding: "Active",
  Active: null,
  Repaid: null,
  Defaulted: null,
};

export default function AdminView({
  projects,
  lang,
  onCreateProject,
  onUpdateStatus,
}: AdminViewProps) {
  const t = translations[lang];
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState<AdminProjectForm>({
    name: "",
    location: "",
    systemSize: 100,
    targetAmount: 50000,
    apy: 12,
    duration: 24,
    risk: "Moderate",
    description: "",
    installerName: "Siwasolar EPC",
  });

  const formatCurrency = (n: number) =>
    n.toLocaleString(lang === "th" ? "th-TH" : "en-US");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.description) return;
    onCreateProject(form);
    addToast("success", t.adCreateSuccess);
    setShowForm(false);
    setForm({
      name: "",
      location: "",
      systemSize: 100,
      targetAmount: 50000,
      apy: 12,
      duration: 24,
      risk: "Moderate",
      description: "",
      installerName: "Siwasolar EPC",
    });
  };

  const handleStatusAction = (project: Project, targetStatus: ProjectStatus) => {
    onUpdateStatus(project.id, targetStatus);
    addToast("info", `${project.name} → ${targetStatus}`);
  };

  const availableActions = (project: Project): { label: string; target: ProjectStatus; color: string }[] => {
    const actions: { label: string; target: ProjectStatus; color: string }[] = [];
    if (project.status === "Created") {
      actions.push({ label: t.adApprove, target: "Funding", color: "bg-emerald-600 hover:bg-emerald-500" });
    }
    if (project.status === "Funding") {
      actions.push({ label: t.adActivate, target: "Active", color: "bg-blue-600 hover:bg-blue-500" });
    }
    if (project.status === "Active") {
      actions.push({ label: t.adMarkRepaid, target: "Repaid", color: "bg-green-600 hover:bg-green-500" });
      actions.push({ label: t.adMarkDefaulted, target: "Defaulted", color: "bg-red-600 hover:bg-red-500" });
    }
    return actions;
  };

  if (selectedProject) {
    return (
      <div className="pb-20">
        <button
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          {t.back}
        </button>

        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedProject.status]}`}>
              {selectedProject.status}
            </span>
            <span className="text-white/40 text-sm">{selectedProject.id}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{selectedProject.name}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <span className="text-xs text-white/40">{t.adLocation}</span>
              <div className="text-sm text-white mt-1">{selectedProject.location}</div>
            </div>
            <div>
              <span className="text-xs text-white/40">{t.adSystemSize}</span>
              <div className="text-sm text-white mt-1">{selectedProject.systemSize} kW</div>
            </div>
            <div>
              <span className="text-xs text-white/40">{t.mpTargetAmount}</span>
              <div className="text-sm text-white mt-1">{formatCurrency(selectedProject.targetAmount)} USDC</div>
            </div>
            <div>
              <span className="text-xs text-white/40">{t.mpAPY}</span>
              <div className="text-sm text-white mt-1">{selectedProject.apy}%</div>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-white/40">{t.mpFundingProgress}</span>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: `${selectedProject.fundingProgress}%` }}
              />
            </div>
            <span className="text-xs text-white/50 mt-1 block">{selectedProject.fundingProgress}% funded</span>
          </div>

          <p className="text-white/70 text-sm mb-6">{selectedProject.description}</p>

          <div className="flex gap-2 flex-wrap">
            {availableActions(selectedProject).map(action => (
              <button
                key={action.target}
                onClick={() => handleStatusAction(selectedProject, action.target)}
                className={`px-4 py-2 ${action.color} text-white rounded-lg text-sm font-medium transition-colors`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.adTitle}</h1>
          <p className="text-white/60 mt-2">{t.adDesc}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? t.close : t.adCreateTitle}
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white/5 border border-white/5 rounded-xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">{t.adCreateTitle}</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adProjectName}</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adLocation}</label>
              <input
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adSystemSize}</label>
              <input
                type="number"
                value={form.systemSize}
                onChange={e => setForm(p => ({ ...p, systemSize: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adTargetAmount}</label>
              <input
                type="number"
                value={form.targetAmount}
                onChange={e => setForm(p => ({ ...p, targetAmount: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                min={1000}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adAPY}</label>
              <input
                type="number"
                value={form.apy}
                onChange={e => setForm(p => ({ ...p, apy: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                min={1}
                max={30}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adDuration}</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                min={1}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adRisk}</label>
              <select
                value={form.risk}
                onChange={e => setForm(p => ({ ...p, risk: e.target.value as RiskLevel }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">{t.adInstaller}</label>
              <input
                value={form.installerName}
                onChange={e => setForm(p => ({ ...p, installerName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-white/40 block mb-1">{t.adDescription}</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 h-20 resize-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.adCreateBtn}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 text-white/40">{t.adNoProjects}</div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/5 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="font-semibold text-white hover:text-emerald-400 transition-colors text-left"
                    >
                      {project.name}
                    </button>
                    <span className="text-white/30 text-xs">{project.id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.location}
                    </span>
                    <span>{project.systemSize} kW</span>
                    <span>{project.apy}% APY</span>
                    <span>{formatCurrency(project.targetAmount)} USDC</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                  <div className="flex gap-1">
                    {availableActions(project).map(action => (
                      <button
                        key={action.target}
                        onClick={() => handleStatusAction(project, action.target)}
                        className={`px-3 py-1.5 ${action.color} text-white rounded-lg text-xs font-medium transition-colors`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
