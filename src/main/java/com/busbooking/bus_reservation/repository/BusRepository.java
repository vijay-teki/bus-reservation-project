package com.busbooking.bus_reservation.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.busbooking.bus_reservation.model.Bus;

public interface BusRepository extends MongoRepository<Bus, String> {
    List<Bus> findBySourceAndDestination(String source, String destination);
}