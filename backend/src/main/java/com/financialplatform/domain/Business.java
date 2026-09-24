package com.financialplatform.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "businesses")
public class Business {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 240)
    private String address;

    @Column(length = 40)
    private String phone;

    @Column(name = "contact_email", length = 254)
    private String contactEmail;

    @Column(length = 300)
    private String website;

    @Column(name = "logo_data_url", columnDefinition = "TEXT")
    private String logoDataUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Business() {}

    public Business(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Instant getCreatedAt() { return createdAt; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public String getPhone() { return phone; }
    public String getContactEmail() { return contactEmail; }
    public String getWebsite() { return website; }
    public String getLogoDataUrl() { return logoDataUrl; }

    public void updateProfile(
            String name,
            String description,
            String address,
            String phone,
            String contactEmail,
            String website,
            String logoDataUrl
    ) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.phone = phone;
        this.contactEmail = contactEmail;
        this.website = website;
        this.logoDataUrl = logoDataUrl;
    }
}
