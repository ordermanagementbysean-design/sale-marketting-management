import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useCreateUser,
  useDeleteUser,
  useRoles,
  useUpdateUser,
  useUsers,
} from "../hooks/userHooks";
import type { CreateUserPayload, UserWithRoles } from "../types";
import { Navigate } from "react-router-dom";

const getRowId = (row: UserWithRoles) => row.id;

const PAGE_SIZE = 15;
const wrapperSx: SxProps<Theme> = { width: "100%" };
const alertSx: SxProps<Theme> = { mb: 2 };
const toolbarSx: SxProps<Theme> = {
  mb: 2,
  display: "flex",
  alignItems: "center",
  gap: 2,
  flexWrap: "wrap",
};
const dataGridSx: SxProps<Theme> = {
  border: "none",
  "& .MuiDataGrid-cell:focus": { outline: "none" },
  "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.100", borderRadius: 1 },
};
const dialogFieldSx: SxProps<Theme> = { mb: 2 };

const UserPageComponent = () => {
  const { t } = useTranslation();
  const { canManageUsers } = useAuth();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: PAGE_SIZE,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
  const [formRole, setFormRole] = useState<string>("");

  const { data: usersData, isLoading, error, refetch } = useUsers({
    page: paginationModel.page + 1,
    per_page: paginationModel.pageSize,
  });
  const { data: roles = [] } = useRoles();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const rows = useMemo(
    () => (error ? [] : usersData?.data ?? []),
    [error, usersData]
  );
  const rowCount = usersData?.total ?? 0;

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPasswordConfirm("");
    setFormRole("marketing");
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((user: UserWithRoles) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormPasswordConfirm("");
    setFormRole(user.role ?? "marketing");
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingUser(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (editingUser) {
      const payload: { name: string; email: string; role: string; password?: string } = {
        name: formName,
        email: formEmail,
        role: formRole,
      };
      if (formPassword) {
        payload.password = formPassword;
        (payload as { password_confirmation?: string }).password_confirmation =
          formPasswordConfirm;
      }
      updateUserMutation.mutate(
        { id: editingUser.id, payload },
        { onSuccess: closeDialog }
      );
    } else {
      const payload: CreateUserPayload = {
        name: formName,
        email: formEmail,
        password: formPassword,
        password_confirmation: formPasswordConfirm,
        role: formRole,
      };
      createUserMutation.mutate(payload, { onSuccess: closeDialog });
    }
  }, [
    editingUser,
    formName,
    formEmail,
    formPassword,
    formPasswordConfirm,
    formRole,
    createUserMutation,
    updateUserMutation,
    closeDialog,
  ]);

  const handleDelete = useCallback(
    (user: UserWithRoles) => {
      if (window.confirm(t("users.deleteConfirm", { name: user.name }))) {
        deleteUserMutation.mutate(user.id);
      }
    },
    [t, deleteUserMutation]
  );

  const roleLabelByValue = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.value, r.label])),
    [roles]
  );

  const columns = useMemo<GridColDef<UserWithRoles>[]>(
    () => [
      { field: "id", headerName: t("users.columns.id"), width: 70 },
      { field: "name", headerName: t("users.columns.name"), flex: 1, minWidth: 140 },
      { field: "email", headerName: t("users.columns.email"), flex: 1, minWidth: 200 },
      {
        field: "role",
        headerName: t("users.columns.roles"),
        flex: 1,
        minWidth: 140,
        valueFormatter: (value: unknown) =>
          typeof value === "string" ? roleLabelByValue[value] ?? value : "",
      },
      {
        field: "actions",
        headerName: "",
        width: 100,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
            >
              {t("users.edit")}
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
            >
              {t("users.delete")}
            </Button>
          </Box>
        ),
      },
    ],
    [t, openEdit, handleDelete, roleLabelByValue]
  );

  const isFormValid = useMemo(() => {
    if (!formName.trim() || !formEmail.trim()) return false;
    if (!editingUser && (!formPassword || formPassword !== formPasswordConfirm))
      return false;
    if (editingUser && formPassword && formPassword !== formPasswordConfirm)
      return false;
    return true;
  }, [
    formName,
    formEmail,
    formPassword,
    formPasswordConfirm,
    editingUser,
  ]);

  if (!canManageUsers) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <Box sx={wrapperSx}>
      {error && (
        <Alert severity="error" sx={alertSx}>
          {t("users.loadError")}
        </Alert>
      )}

      <Box sx={toolbarSx}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          {t("users.addUser")}
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          {t("orders.refresh")}
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={isLoading}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 15, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        sx={dataGridSx}
      />

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? t("users.editUser") : t("users.addUser")}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("users.columns.name")}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("users.columns.email")}
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            disabled={!!editingUser}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={editingUser ? t("users.newPassword") : t("auth.password")}
            type="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            placeholder={editingUser ? t("users.leaveBlank") : undefined}
            sx={dialogFieldSx}
          />
          <TextField
            fullWidth
            label={t("users.passwordConfirm")}
            type="password"
            value={formPasswordConfirm}
            onChange={(e) => setFormPasswordConfirm(e.target.value)}
            sx={dialogFieldSx}
          />
          <FormControl fullWidth sx={dialogFieldSx}>
            <InputLabel id="user-role-label">{t("users.roles")}</InputLabel>
            <Select
              labelId="user-role-label"
              label={t("users.roles")}
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t("users.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isFormValid || createUserMutation.isPending || updateUserMutation.isPending}
          >
            {editingUser ? t("users.save") : t("users.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const UserPage = memo(UserPageComponent);
export default UserPage;
