import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RequestStatus } from "@app/shared-types";
import { requestsApi, RequestFilters, RequestItem } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { RequestFiltersBar } from "@/features/requests/RequestFilters";
import { RequestCard } from "@/features/requests/RequestCard";
import { ExportButtons } from "@/features/requests/ExportButtons";
import { Spinner, EmptyState } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { Inbox, GripVertical, ArrowDownUp, Check } from "lucide-react";

/** Tartiblash rejimidagi bitta sudraladigan qator. */
function SortableRow({ request }: { request: RequestItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 ${isDragging ? "z-20 relative opacity-90 scale-[1.01]" : ""}`}
    >
      <span
        {...attributes}
        {...listeners}
        className="touch-none flex-shrink-0 p-2 -ml-1 text-inkFaint active:text-accent cursor-grab"
        aria-label="Sudrab tartiblash"
      >
        <GripVertical size={18} strokeWidth={2} />
      </span>
      {/* pointer-events-none — tartiblash rejimida kartaga bosib o'tib ketmaslik uchun */}
      <div className="flex-1 min-w-0 pointer-events-none">
        <RequestCard request={request} />
      </div>
    </div>
  );
}

export function ChiefAllRequestsPage() {
  const [filters, setFilters] = useState<RequestFilters>({ pageSize: 50 });
  const [sortMode, setSortMode] = useState(false);
  const [ordered, setOrdered] = useState<RequestItem[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "chief", filters],
    queryFn: () => requestsApi.list(filters).then((r) => r.data),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => requestsApi.reorder(orderedIds),
    onError: () => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert("Tartibni saqlab bo'lmadi. Qayta urinib ko'ring.");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function enterSortMode() {
    // Faqat ochiq (yopilmagan) zayavkalar tartiblanadi.
    const open = (data?.items ?? []).filter((r) => r.status !== RequestStatus.CLOSED);
    setOrdered(open);
    setSortMode(true);
  }

  function exitSortMode() {
    setSortMode(false);
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrdered((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const next = arrayMove(items, oldIndex, newIndex);
      // Har bir ko'chirishdan so'ng yangi tartib serverda saqlanadi.
      reorderMutation.mutate(next.map((i) => i.id));
      telegram.HapticFeedback.impactOccurred("light");
      return next;
    });
  }

  if (sortMode) {
    return (
      <div className="pt-3 pb-8">
        <div className="px-4 mb-3 flex items-center justify-between gap-2">
          <p className="text-[12.5px] text-tg-hint leading-snug flex-1">
            Zayavkalarni tutqichdan ushlab sudrang — ish ketma-ketligi avtomatik saqlanadi.
          </p>
          <button
            onClick={exitSortMode}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-accent text-white text-[12.5px] font-bold active:opacity-80"
          >
            <Check size={15} strokeWidth={2.5} /> Tayyor
          </button>
        </div>
        {ordered.length === 0 ? (
          <EmptyState title="Tartiblash uchun ochiq zayavka yo'q" icon={Inbox} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ordered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="px-4 space-y-3">
                {ordered.map((r) => (
                  <SortableRow key={r.id} request={r} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  return (
    <div>
      <RequestFiltersBar filters={filters} onChange={setFilters} showPeopleFilters />
      <div className="px-4 pb-3 -mt-1">
        <button
          onClick={enterSortMode}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-control border-[1.5px] border-lineStrong text-[12.5px] font-bold text-inkSoft active:opacity-70 disabled:opacity-50"
        >
          <ArrowDownUp size={15} strokeWidth={2} /> Ish ketma-ketligini tartiblash
        </button>
      </div>
      <ExportButtons filters={filters} />
      {isLoading ? (
        <Spinner label="Yuklanmoqda..." />
      ) : (
        <RequestList
          items={data?.items}
          isLoading={isLoading}
          emptyTitle="Zayavkalar topilmadi"
          emptySubtitle="Filtrlarni o'zgartirib ko'ring"
          emptyIcon={Inbox}
        />
      )}
    </div>
  );
}
