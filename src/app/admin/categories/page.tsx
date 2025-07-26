"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, GripVertical } from "lucide-react";
import Image from "next/image";
import { useAdminApp } from "@/components/AdminAppProvider";

// 分类类型定义
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

// 表单值类型
interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

// 文本截断辅助函数
const truncateText = (text: string | null, maxLength: number = 30): string => {
  if (!text) return "-";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// 可排序的表格行组件
interface SortableRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onPreview: (icon: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  category,
  onEdit,
  onDelete,
  onPreview,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-muted/50" : ""}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {category.id}
        </div>
      </TableCell>
      <TableCell>{category.sortOrder}</TableCell>
      <TableCell>
        {category.icon ? (
          <div
            className="w-10 h-10 relative border rounded cursor-pointer"
            onClick={() => onPreview(category.icon!)}
          >
            <Image
              src={category.icon}
              alt="分类图标"
              fill
              className="object-contain rounded"
              unoptimized={category.icon.endsWith(".svg")}
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
            <Plus className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>{category.slug}</TableCell>
      <TableCell>{truncateText(category.description, 30)}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
            title="编辑"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category.id)}
            title="删除"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormValues>({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const { message: adminMessage } = useAdminApp();

  // 拖拽传感器设置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = categories.findIndex(
      category => category.id === active.id
    );
    const overIndex = categories.findIndex(category => category.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newCategories = arrayMove(categories, activeIndex, overIndex);

      // 更新本地状态
      setCategories(newCategories);

      // 准备排序更新数据
      const updates = newCategories.map((category, index) => ({
        id: category.id,
        sortOrder: index + 1,
      }));

      try {
        // 发送批量更新请求
        const response = await fetch("/api/admin/categories/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });

        const data = await response.json();
        if (data.success) {
          adminMessage.success("排序更新成功");
          // 重新获取分类列表以确保数据同步
          await fetchCategories();
        } else {
          adminMessage.error(data.message || "排序更新失败");
          // 失败时恢复原始顺序
          await fetchCategories();
        }
      } catch (error) {
        console.error("更新排序失败:", error);
        adminMessage.error("排序更新失败，请稍后重试");
        // 失败时恢复原始顺序
        await fetchCategories();
      }
    }
  };

  // 获取分类列表
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();

      if (data.success) {
        // 按照 sortOrder 排序
        const sortedCategories = [...data.data].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        setCategories(sortedCategories);
      } else {
        adminMessage.error(data.message || "获取分类列表失败");
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
      adminMessage.error("获取分类列表失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [adminMessage]);

  // 初始加载
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 处理表单输入变化
  const handleInputChange = (
    name: keyof CategoryFormValues,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 处理图标文件选择
  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setIconFile(file);
  };

  // 添加分类
  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      sortOrder: 0,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    });
    setIconFile(null);
    setModalVisible(true);
  };

  // 编辑分类
  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    setFormData({
      name: record.name,
      slug: record.slug,
      description: record.description || "",
      sortOrder: record.sortOrder,
      seoTitle: record.seoTitle || "",
      seoDescription: record.seoDescription || "",
      seoKeywords: record.seoKeywords || "",
    });
    setIconFile(null);
    setModalVisible(true);
  };

  // 保存分类
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      adminMessage.error("请填写必填字段");
      return;
    }

    try {
      setLoading(true);

      // 处理图标上传
      let iconPath = null;
      if (iconFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", iconFile);
        formDataUpload.append("type", "category");

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: formDataUpload,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          iconPath = uploadData.data.path;
        } else {
          adminMessage.error(uploadData.message || "图标上传失败");
          return;
        }
      } else if (editingId) {
        // 如果是编辑且没有新上传图标，保留原图标
        const currentCategory = categories.find(c => c.id === editingId);
        iconPath = currentCategory?.icon || null;
      }

      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          icon: iconPath,
          sortOrder: Number(formData.sortOrder),
          seoTitle: formData.seoTitle || null,
          seoDescription: formData.seoDescription || null,
          seoKeywords: formData.seoKeywords || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        adminMessage.success(editingId ? "更新分类成功" : "添加分类成功");
        setModalVisible(false);
        setEditingId(null);
        setIconFile(null);
        fetchCategories();
      } else {
        adminMessage.error(
          data.message || (editingId ? "更新分类失败" : "添加分类失败")
        );
      }
    } catch (error) {
      console.error(editingId ? "更新分类失败:" : "添加分类失败:", error);
      adminMessage.error(
        editingId ? "更新分类失败，请稍后重试" : "添加分类失败，请稍后重试"
      );
    } finally {
      setLoading(false);
    }
  };

  // 删除分类
  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "确定要删除这个分类吗？删除后无法恢复，该分类下的网站将失去分类关联。"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        adminMessage.success("删除分类成功");
        fetchCategories();
      } else {
        adminMessage.error(data.message || "删除分类失败");
      }
    } catch (error) {
      console.error("删除分类失败:", error);
      adminMessage.error("删除分类失败，请稍后重试");
    }
  };

  // 确认删除函数
  const confirmDelete = (id: number) => {
    if (
      window.confirm(
        "确定要删除这个分类吗？删除后无法恢复，该分类下的网站将失去分类关联。"
      )
    ) {
      handleDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">分类管理</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          添加分类
        </Button>
      </div>

      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-16">排序</TableHead>
                <TableHead className="w-16">图标</TableHead>
                <TableHead>分类名称</TableHead>
                <TableHead>英文标识</TableHead>
                <TableHead>简介</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={categories.map(category => category.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map(category => (
                  <SortableRow
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={confirmDelete}
                    onPreview={setPreviewImage}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑分类" : "添加分类"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "修改分类信息和SEO设置"
                : "创建新的分类并设置SEO信息"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">基本信息</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      分类名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange("name", e.target.value)}
                      placeholder="请输入分类名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">
                      英文标识 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={e => handleInputChange("slug", e.target.value)}
                      placeholder="请输入英文标识"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">排序</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={e =>
                      handleInputChange(
                        "sortOrder",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="请输入排序数值"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">分类图标</Label>
                  <Input
                    id="icon"
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                  />
                  {editingId &&
                    categories.find(c => c.id === editingId)?.icon && (
                      <div className="w-20 h-20 relative border rounded">
                        <Image
                          src={
                            categories.find(c => c.id === editingId)?.icon || ""
                          }
                          alt="当前图标"
                          fill
                          className="object-contain rounded"
                          unoptimized
                        />
                      </div>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">分类简介</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="请输入分类简介"
                    rows={4}
                  />
                </div>
              </div>

              {/* 右侧 SEO 设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">SEO 设置</h3>

                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO 标题</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={e =>
                      handleInputChange("seoTitle", e.target.value)
                    }
                    placeholder="请输入 SEO 标题"
                  />
                  <p className="text-sm text-muted-foreground">
                    用于搜索引擎优化，如不填写则使用默认格式
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO 描述</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={e =>
                      handleInputChange("seoDescription", e.target.value)
                    }
                    placeholder="请输入 SEO 描述"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    用于搜索引擎优化，如不填写则使用分类简介
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">SEO 关键词</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={e =>
                      handleInputChange("seoKeywords", e.target.value)
                    }
                    placeholder="请输入 SEO 关键词，多个关键词用英文逗号分隔"
                  />
                  <p className="text-sm text-muted-foreground">
                    用于搜索引擎优化，多个关键词用英文逗号分隔
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalVisible(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 图片预览 */}
      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>图标预览</DialogTitle>
              <DialogDescription>分类图标预览</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center p-6">
              <Image
                src={previewImage}
                alt="图标预览"
                width={300}
                height={300}
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
