package com.busbooking.bus_reservation.model;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "buses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bus {
    @Id
    private String id;
    private String busNumber;
    private String source;
    private String destination;
    private String departureTime;
    private int totalSeats;
    private int seatsAvailable;
    private double price;
    private Map<Integer, String> bookedSeats = new HashMap<>();
	public Map<Integer, String> getBookedSeats() {
		return bookedSeats;
	}
	public void setBookedSeats(Map<Integer, String> bookedSeats) {
		this.bookedSeats = bookedSeats;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getBusNumber() {
		return busNumber;
	}
	public void setBusNumber(String busNumber) {
		this.busNumber = busNumber;
	}
	public String getSource() {
		return source;
	}
	public void setSource(String source) {
		this.source = source;
	}
	public String getDestination() {
		return destination;
	}
	public void setDestination(String destination) {
		this.destination = destination;
	}
	public String getDepartureTime() {
		return departureTime;
	}
	public void setDepartureTime(String departureTime) {
		this.departureTime = departureTime;
	}
	public int getTotalSeats() {
		return totalSeats;
	}
	public void setTotalSeats(int totalSeats) {
		this.totalSeats = totalSeats;
	}
	public int getSeatsAvailable() {
		return seatsAvailable;
	}
	public void setSeatsAvailable(int seatsAvailable) {
		this.seatsAvailable = seatsAvailable;
	}

	public double getPrice() {
		return price;
	}
	public void setPrice(double price) {
		this.price = price;
	}
	@Override
	public String toString() {
		return "Bus [id=" + id + ", busNumber=" + busNumber + ", source=" + source + ", destination=" + destination
				+ ", departureTime=" + departureTime + ", totalSeats=" + totalSeats + ", seatsAvailable="
				+ seatsAvailable + ", price=" + price + ", bookedSeats=" + bookedSeats + ", getBookedSeats()="
				+ getBookedSeats() + ", getId()=" + getId() + ", getBusNumber()=" + getBusNumber() + ", getSource()="
				+ getSource() + ", getDestination()=" + getDestination() + ", getDepartureTime()=" + getDepartureTime()
				+ ", getTotalSeats()=" + getTotalSeats() + ", getSeatsAvailable()=" + getSeatsAvailable()
				+ ", getPrice()=" + getPrice() + ", getClass()=" + getClass() + ", hashCode()=" + hashCode()
				+ ", toString()=" + super.toString() + "]";
	}
    
    
}