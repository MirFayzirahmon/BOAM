package com.assettrack.repository;

import com.assettrack.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    List<Employee> findAllByOrderByFullNameAsc();

    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);

    Optional<Employee> findByEmailIgnoreCase(String email);
}
