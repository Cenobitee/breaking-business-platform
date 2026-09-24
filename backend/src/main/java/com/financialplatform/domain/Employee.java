package com.financialplatform.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false, updatable = false)
    private Business business;

    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 120) private String position;
    @Column(nullable = false, length = 300) private String address;
    @Column(nullable = false, length = 40) private String nid;
    @Column(nullable = false, length = 40) private String phone;
    @Column(nullable = false, length = 80) private String shift;
    @Column(nullable = false, precision = 14, scale = 2) private BigDecimal salary;
    @Column(name = "joining_date", nullable = false) private LocalDate joiningDate;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected Employee() {}

    public Employee(Business business, String name, String position, String address, String nid,
                    String phone, String shift, BigDecimal salary, LocalDate joiningDate) {
        this.business = business;
        update(name, position, address, nid, phone, shift, salary, joiningDate);
    }

    public void update(String name, String position, String address, String nid, String phone,
                       String shift, BigDecimal salary, LocalDate joiningDate) {
        this.name = name.trim(); this.position = position.trim(); this.address = address.trim();
        this.nid = nid.trim(); this.phone = phone.trim(); this.shift = shift.trim();
        this.salary = salary; this.joiningDate = joiningDate;
    }

    public Long getId() { return id; }
    public Business getBusiness() { return business; }
    public String getName() { return name; }
    public String getPosition() { return position; }
    public String getAddress() { return address; }
    public String getNid() { return nid; }
    public String getPhone() { return phone; }
    public String getShift() { return shift; }
    public BigDecimal getSalary() { return salary; }
    public LocalDate getJoiningDate() { return joiningDate; }
    public Instant getCreatedAt() { return createdAt; }
}
