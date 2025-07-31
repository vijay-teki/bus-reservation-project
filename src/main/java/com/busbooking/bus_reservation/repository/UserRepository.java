package com.busbooking.bus_reservation.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.busbooking.bus_reservation.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}