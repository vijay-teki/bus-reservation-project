package com.busbooking.bus_reservation.service;

import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.busbooking.bus_reservation.model.Bus;
import com.busbooking.bus_reservation.model.Reservation;
import com.busbooking.bus_reservation.repository.BusRepository;
import com.busbooking.bus_reservation.repository.ReservationRepository;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private BusRepository busRepository;

    public Reservation bookSeat(Reservation reservation) {
        Bus bus = busRepository.findById(reservation.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + reservation.getBusId()));

        // Check if the specific seat is already booked
        if (bus.getBookedSeats().containsKey(reservation.getSeatNumber())) {
            throw new RuntimeException("Seat " + reservation.getSeatNumber() + " is already booked.");
        }

        // --- FIX: THIS IS THE KEY CHANGE ---
        // Instead of checking bus.getSeatsAvailable(), we check the actual size of the booked seats map.
        // This is more reliable and prevents data inconsistency issues.
        if (bus.getBookedSeats().size() >= bus.getTotalSeats()) {
            throw new RuntimeException("No seats available on this bus.");
        }
        // --- END OF FIX ---

        // Set reservation status
        reservation.setStatus("BOOKED");
        
        // Save the reservation first to get its ID
        Reservation savedReservation = reservationRepository.save(reservation);

        // Update bus with the newly booked seat
        bus.getBookedSeats().put(savedReservation.getSeatNumber(), savedReservation.getId());
        // This calculation remains correct and robust
        bus.setSeatsAvailable(bus.getTotalSeats() - bus.getBookedSeats().size());
        busRepository.save(bus);

        return savedReservation;
    }

    public String cancelReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found with id: " + reservationId));

        if ("CANCELLED".equals(reservation.getStatus())) {
            throw new RuntimeException("This reservation has already been cancelled.");
        }
        
        Bus bus = busRepository.findById(reservation.getBusId())
                .orElseThrow(() -> new RuntimeException("Associated bus not found."));

        bus.getBookedSeats().remove(reservation.getSeatNumber());
        bus.setSeatsAvailable(bus.getTotalSeats() - bus.getBookedSeats().size());
        busRepository.save(bus);

        reservation.setStatus("CANCELLED");
        reservationRepository.save(reservation);

        return "Reservation cancelled successfully";
    }

    public List<Reservation> getUserReservations(String userId) {
        return reservationRepository.findByUserId(userId);
    }
}
