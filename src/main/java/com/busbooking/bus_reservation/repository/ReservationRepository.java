package com.busbooking.bus_reservation.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.busbooking.bus_reservation.model.Reservation;

public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByUserId(String userId);
    List<Reservation> findByBusId(String busId);
    List<Reservation> findByBusIdAndStatus(String busId, String status);
}