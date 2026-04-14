import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { forgotPassword } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import {
    deleteMyAccount,
    getMyAccount,
    updateMyAccount
} from "../api/userApi";
import {
    createMyAddress,
    deleteMyAddress,
    getMyAddresses,
    updateMyAddress
} from "../api/userAddressApi";
import "./AccountPage.css";

const emptyAddressForm = {
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false
};

function sortAddresses(addresses) {
    return [...addresses].sort((a, b) => {
        if (a.isDefault === b.isDefault) {
            return a.userAddressId - b.userAddressId;
        }

        return a.isDefault ? -1 : 1;
    });
}

export default function AccountPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading, logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [originalFormData, setOriginalFormData] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [addresses, setAddresses] = useState([]);
    const [editableAddresses, setEditableAddresses] = useState([]);
    const [addressForm, setAddressForm] = useState(emptyAddressForm);

    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingAddresses, setIsEditingAddresses] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [isSavingAddresses, setIsSavingAddresses] = useState(false);
    const [isUpdatingDefault, setIsUpdatingDefault] = useState(null);

    useEffect(() => {
        async function loadAccount() {
            try {
                const [user, userAddresses] = await Promise.all([
                    getMyAccount(),
                    getMyAddresses()
                ]);

                const nextFormData = {
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    email: user.email ?? ""
                };

                const sortedAddresses = sortAddresses(userAddresses);

                setFormData(nextFormData);
                setOriginalFormData(nextFormData);
                setAddresses(sortedAddresses);
                setEditableAddresses(sortedAddresses);
            } catch (err) {
                setError(err.message || "Failed to load account.");
            } finally {
                setPageLoading(false);
            }
        }

        if (!loading && isAuthenticated) {
            loadAccount();
        } else if (!loading) {
            setPageLoading(false);
        }
    }, [loading, isAuthenticated]);

    if (loading || pageLoading) {
        return <p className="account-status">Loading account...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    function clearMessages() {
        setStatusMessage("");
        setError("");
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function handleAddressFormChange(event) {
        const { name, value, type, checked } = event.target;

        setAddressForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function handleEditableAddressChange(index, event) {
        const { name, value } = event.target;

        setEditableAddresses((prev) =>
            prev.map((address, addressIndex) =>
                addressIndex === index
                    ? {
                        ...address,
                        [name]: value
                    }
                    : address
            )
        );
    }

    function isValidName(name) {
        return /^[A-Za-z]+([ '-][A-Za-z]+)*$/.test(name);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function reloadAddresses() {
        const userAddresses = await getMyAddresses();
        const sortedAddresses = sortAddresses(userAddresses);

        setAddresses(sortedAddresses);
        setEditableAddresses(sortedAddresses);
    }

    function handleEditProfile() {
        clearMessages();
        setIsEditingProfile(true);
    }

    function handleCancelProfileEdit() {
        clearMessages();
        setFormData(originalFormData);
        setIsEditingProfile(false);
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        clearMessages();

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();

        if (!firstName || !isValidName(firstName)) {
            setError("First name contains invalid characters.");
            return;
        }

        if (!lastName || !isValidName(lastName)) {
            setError("Last name contains invalid characters.");
            return;
        }

        if (!email || !isValidEmail(email)) {
            setError("Enter a valid email address.");
            return;
        }

        try {
            await updateMyAccount({
                firstName,
                lastName,
                email
            });

            const updated = { firstName, lastName, email };
            setFormData(updated);
            setOriginalFormData(updated);
            setIsEditingProfile(false);
            setStatusMessage("Account updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update account.");
        }
    }

    async function handleSendPasswordReset() {
        clearMessages();

        try {
            const response = await forgotPassword(formData.email.trim());
            setStatusMessage(response.message || "Password reset email sent.");
        } catch (err) {
            setError(err.message || "Failed to send password reset email.");
        }
    }

    function startEditingAddresses() {
        clearMessages();
        setEditableAddresses(sortAddresses(addresses));
        setIsEditingAddresses(true);
        setShowAddAddress(false);
    }

    function cancelEditingAddresses() {
        clearMessages();
        setEditableAddresses(sortAddresses(addresses));
        setIsEditingAddresses(false);
    }

    async function handleSaveAddressEdits() {
        clearMessages();

        try {
            setIsSavingAddresses(true);

            const updatedAddresses = editableAddresses.map((address) => ({
                ...address,
                fullName: address.fullName.trim(),
                addressLine1: address.addressLine1.trim(),
                addressLine2: (address.addressLine2 ?? "").trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                postalCode: address.postalCode.trim(),
                country: address.country.trim()
            }));

            const defaultAddress =
                updatedAddresses.find((address) => address.isDefault) || null;

            await Promise.all(
                updatedAddresses.map((address) =>
                    updateMyAddress(address.userAddressId, {
                        fullName: address.fullName,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        country: address.country,
                        isDefault: defaultAddress
                            ? address.userAddressId === defaultAddress.userAddressId
                            : false
                    })
                )
            );

            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));
            setIsEditingAddresses(false);
            setStatusMessage("Addresses updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update addresses.");
        } finally {
            setIsSavingAddresses(false);
        }
    }

    async function handleSetDefaultAddress(addressId) {
        clearMessages();

        const currentScrollY = window.scrollY;
        setIsUpdatingDefault(addressId);

        try {
            await Promise.all(
                addresses.map((address) =>
                    updateMyAddress(address.userAddressId, {
                        fullName: address.fullName,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2 ?? "",
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        country: address.country,
                        isDefault: address.userAddressId === addressId
                    })
                )
            );

            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));

            requestAnimationFrame(() => {
                window.scrollTo({
                    top: currentScrollY,
                    behavior: "auto"
                });
            });

            setStatusMessage("Default address updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update default address.");
        } finally {
            setIsUpdatingDefault(null);
        }
    }

    async function handleCreateAddress(event) {
        event.preventDefault();
        clearMessages();

        try {
            await createMyAddress({
                fullName: addressForm.fullName.trim(),
                addressLine1: addressForm.addressLine1.trim(),
                addressLine2: addressForm.addressLine2.trim(),
                city: addressForm.city.trim(),
                state: addressForm.state.trim(),
                postalCode: addressForm.postalCode.trim(),
                country: addressForm.country.trim(),
                isDefault: addressForm.isDefault
            });

            setAddressForm(emptyAddressForm);
            setShowAddAddress(false);

            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));
            setStatusMessage("Address added successfully.");
        } catch (err) {
            setError(err.message || "Failed to add address.");
        }
    }

    async function handleDeleteAddress(id) {
        const confirmed = window.confirm("Are you sure you want to delete this address?");
        if (!confirmed) return;

        clearMessages();

        try {
            await deleteMyAddress(id);
            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));
            setStatusMessage("Address deleted successfully.");
        } catch (err) {
            setError(err.message || "Failed to delete address.");
        }
    }

    async function handleDeleteAccount() {
        const confirmed = window.confirm("Are you sure you want to delete your account?");
        if (!confirmed) return;

        try {
            await deleteMyAccount();
            logout();
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to delete account.");
        }
    }

    return (
        <main className="account-page">
            <section className="account-wrapper">
                <header className="account-header">
                    <h1 className="account-title">My Account</h1>
                </header>

                {(statusMessage || error) && (
                    <div className="account-messages">
                        {statusMessage && <p className="account-success">{statusMessage}</p>}
                        {error && <p className="account-error">{error}</p>}
                    </div>
                )}

                <div className="account-columns">
                    <section className="account-section">
                        <div className="account-section-head">
                            <h2 className="account-section-title">Personal Information</h2>
                            <div className="account-section-line" />
                        </div>

                        {!isEditingProfile ? (
                            <div className="account-info-list">
                                <p className="account-info-row">
                                    <span className="account-info-label">First Name:</span>{" "}
                                    <span className="account-info-value">{formData.firstName}</span>
                                </p>

                                <p className="account-info-row">
                                    <span className="account-info-label">Last Name:</span>{" "}
                                    <span className="account-info-value">{formData.lastName}</span>
                                </p>

                                <p className="account-info-row">
                                    <span className="account-info-label">Email:</span>{" "}
                                    <span className="account-info-value">{formData.email}</span>
                                </p>
                            </div>
                        ) : (
                            <form className="account-form" onSubmit={handleProfileSubmit}>
                                <label className="account-field">
                                    <span className="account-field-label">First Name</span>
                                    <input
                                        className="account-input"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label className="account-field">
                                    <span className="account-field-label">Last Name</span>
                                    <input
                                        className="account-input"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </label>

                                <label className="account-field">
                                    <span className="account-field-label">Email</span>
                                    <input
                                        className="account-input"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </label>

                                <div className="account-inline-actions">
                                    <button type="submit" className="account-button">
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="account-button account-button-secondary"
                                        onClick={handleCancelProfileEdit}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="account-button-stack account-button-stack-actions">
                            {!isEditingProfile && (
                                <button
                                    type="button"
                                    className="account-button"
                                    onClick={handleEditProfile}
                                >
                                    Edit
                                </button>
                            )}

                            <button
                                type="button"
                                className="account-button"
                                onClick={handleSendPasswordReset}
                            >
                                Reset Password
                            </button>

                            <button
                                type="button"
                                className="account-button account-button-danger"
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </button>
                        </div>
                    </section>

                    <section className="account-section">
                        <div className="account-section-head">
                            <h2 className="account-section-title">Addresses</h2>
                            <div className="account-section-line" />
                        </div>

                        <div className="account-address-list">
                            {!isEditingAddresses &&
                                addresses.map((address) => (
                                    <div
                                        key={address.userAddressId}
                                        className="account-address-item"
                                    >
                                        <div className="account-address-card">
                                            <div className="account-address-text">
                                                <div className="account-address-name-row">
                                                    <span className="account-address-name">
                                                        {address.fullName}
                                                    </span>
                                                    {address.isDefault && (
                                                        <span className="account-address-default">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>

                                                <p>{address.addressLine1}</p>
                                                {address.addressLine2 ? (
                                                    <p>{address.addressLine2}</p>
                                                ) : null}
                                                <p>
                                                    {address.city}, {address.state}{" "}
                                                    {address.postalCode}
                                                </p>
                                                <p>{address.country}</p>

                                                <div className="account-default-row">
                                                    <label className="account-radio-label">
                                                        <input
                                                            type="radio"
                                                            name="defaultAddress"
                                                            checked={address.isDefault}
                                                            onChange={() =>
                                                                handleSetDefaultAddress(
                                                                    address.userAddressId
                                                                )
                                                            }
                                                            disabled={
                                                                isUpdatingDefault !== null &&
                                                                isUpdatingDefault !==
                                                                address.userAddressId
                                                            }
                                                        />
                                                        <span>Set as default</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {isEditingAddresses &&
                                editableAddresses.map((address, index) => (
                                    <div
                                        key={address.userAddressId}
                                        className="account-address-item account-address-item-editing"
                                    >
                                        <div className="account-address-card account-address-card-editing">
                                            <div className="account-edit-address-fields">
                                                <label className="account-field">
                                                    <span className="account-field-label">
                                                        Full Name
                                                    </span>
                                                    <input
                                                        className="account-input"
                                                        name="fullName"
                                                        value={address.fullName ?? ""}
                                                        onChange={(event) =>
                                                            handleEditableAddressChange(index, event)
                                                        }
                                                    />
                                                </label>

                                                <label className="account-field">
                                                    <span className="account-field-label">
                                                        Address Line 1
                                                    </span>
                                                    <input
                                                        className="account-input"
                                                        name="addressLine1"
                                                        value={address.addressLine1 ?? ""}
                                                        onChange={(event) =>
                                                            handleEditableAddressChange(index, event)
                                                        }
                                                    />
                                                </label>

                                                <label className="account-field">
                                                    <span className="account-field-label">
                                                        Address Line 2
                                                    </span>
                                                    <input
                                                        className="account-input"
                                                        name="addressLine2"
                                                        value={address.addressLine2 ?? ""}
                                                        onChange={(event) =>
                                                            handleEditableAddressChange(index, event)
                                                        }
                                                    />
                                                </label>

                                                <div className="account-address-grid">
                                                    <label className="account-field">
                                                        <span className="account-field-label">
                                                            City
                                                        </span>
                                                        <input
                                                            className="account-input"
                                                            name="city"
                                                            value={address.city ?? ""}
                                                            onChange={(event) =>
                                                                handleEditableAddressChange(index, event)
                                                            }
                                                        />
                                                    </label>

                                                    <label className="account-field">
                                                        <span className="account-field-label">
                                                            State
                                                        </span>
                                                        <input
                                                            className="account-input"
                                                            name="state"
                                                            value={address.state ?? ""}
                                                            onChange={(event) =>
                                                                handleEditableAddressChange(index, event)
                                                            }
                                                        />
                                                    </label>
                                                </div>

                                                <div className="account-address-grid">
                                                    <label className="account-field">
                                                        <span className="account-field-label">
                                                            Postal Code
                                                        </span>
                                                        <input
                                                            className="account-input"
                                                            name="postalCode"
                                                            value={address.postalCode ?? ""}
                                                            onChange={(event) =>
                                                                handleEditableAddressChange(index, event)
                                                            }
                                                        />
                                                    </label>

                                                    <label className="account-field">
                                                        <span className="account-field-label">
                                                            Country
                                                        </span>
                                                        <input
                                                            className="account-input"
                                                            name="country"
                                                            value={address.country ?? ""}
                                                            onChange={(event) =>
                                                                handleEditableAddressChange(index, event)
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="account-trash-button"
                                                onClick={() =>
                                                    handleDeleteAddress(address.userAddressId)
                                                }
                                                aria-label="Delete address"
                                                title="Delete address"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="account-address-action-row">
                            {!isEditingAddresses && !showAddAddress && (
                                <button
                                    type="button"
                                    className="account-button"
                                    onClick={startEditingAddresses}
                                >
                                    Edit Addresses
                                </button>
                            )}

                            {!showAddAddress && !isEditingAddresses && (
                                <button
                                    type="button"
                                    className="account-button"
                                    onClick={() => {
                                        clearMessages();
                                        setShowAddAddress(true);
                                    }}
                                >
                                    Add Address
                                </button>
                            )}

                            {isEditingAddresses && (
                                <>
                                    <button
                                        type="button"
                                        className="account-button"
                                        onClick={handleSaveAddressEdits}
                                        disabled={isSavingAddresses}
                                    >
                                        {isSavingAddresses ? "Saving..." : "Save Addresses"}
                                    </button>

                                    <button
                                        type="button"
                                        className="account-button account-button-secondary"
                                        onClick={cancelEditingAddresses}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>

                        {showAddAddress && (
                            <form className="account-address-form account-address-form-spaced" onSubmit={handleCreateAddress}>
                                <h3 className="account-subtitle">Add Address</h3>

                                <label className="account-field">
                                    <span className="account-field-label">Full Name</span>
                                    <input
                                        className="account-input"
                                        name="fullName"
                                        value={addressForm.fullName}
                                        onChange={handleAddressFormChange}
                                    />
                                </label>

                                <label className="account-field">
                                    <span className="account-field-label">Address Line 1</span>
                                    <input
                                        className="account-input"
                                        name="addressLine1"
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressFormChange}
                                    />
                                </label>

                                <label className="account-field">
                                    <span className="account-field-label">Address Line 2</span>
                                    <input
                                        className="account-input"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressFormChange}
                                    />
                                </label>

                                <div className="account-address-grid">
                                    <label className="account-field">
                                        <span className="account-field-label">City</span>
                                        <input
                                            className="account-input"
                                            name="city"
                                            value={addressForm.city}
                                            onChange={handleAddressFormChange}
                                        />
                                    </label>

                                    <label className="account-field">
                                        <span className="account-field-label">State</span>
                                        <input
                                            className="account-input"
                                            name="state"
                                            value={addressForm.state}
                                            onChange={handleAddressFormChange}
                                        />
                                    </label>
                                </div>

                                <div className="account-address-grid">
                                    <label className="account-field">
                                        <span className="account-field-label">Postal Code</span>
                                        <input
                                            className="account-input"
                                            name="postalCode"
                                            value={addressForm.postalCode}
                                            onChange={handleAddressFormChange}
                                        />
                                    </label>

                                    <label className="account-field">
                                        <span className="account-field-label">Country</span>
                                        <input
                                            className="account-input"
                                            name="country"
                                            value={addressForm.country}
                                            onChange={handleAddressFormChange}
                                        />
                                    </label>
                                </div>

                                <label className="account-checkbox">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={addressForm.isDefault}
                                        onChange={handleAddressFormChange}
                                    />
                                    <span>Set as default address</span>
                                </label>

                                <div className="account-inline-actions">
                                    <button type="submit" className="account-button">
                                        Save Address
                                    </button>

                                    <button
                                        type="button"
                                        className="account-button account-button-secondary"
                                        onClick={() => {
                                            setShowAddAddress(false);
                                            setAddressForm(emptyAddressForm);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}